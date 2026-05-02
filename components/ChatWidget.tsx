"use client";

import { useEffect, useRef, useState } from "react";

interface Msg {
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  toolName?: string | null;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [convoId, setConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // İlk açılışta son konuşmayı yükle
  useEffect(() => {
    if (!open || messages.length > 0) return;
    fetch("/api/chat")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.conversationId) {
          setConvoId(d.conversationId);
          setMessages(d.messages);
        }
      })
      .catch(() => { /* sessizce yok say */ });
  }, [open, messages.length]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setError(null);
    setBusy(true);
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convoId, message: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
      } else {
        setConvoId(data.conversationId);
        setMessages((m) => [...m, ...data.messages]);
      }
    } catch (e: any) {
      setError("Ağ hatası: " + (e?.message ?? ""));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-lg px-5 py-3 text-sm font-medium flex items-center gap-2"
        aria-label="Asistanı aç"
      >
        <SparkleIcon /> Asistan
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[min(100vw-2rem,380px)] h-[min(100vh-3rem,560px)] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <SparkleIcon />
          <h3 className="text-sm font-semibold">Rosadore Asistan</h3>
        </div>
        <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-900" aria-label="Kapat">✕</button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
        {messages.length === 0 ? (
          <div className="text-slate-500 text-center py-6 px-4">
            <p className="mb-2">Merhaba! Ürünler, fiyatlar veya siparişlerinizle ilgili soru sorabilirsiniz.</p>
            <ul className="text-xs text-left list-disc list-inside space-y-1">
              <li>{`"kanepe öner"`}</li>
              <li>{`"TUFTED-ROYALE-3 detayı"`}</li>
              <li>{`"sepetimi göster"`}</li>
              <li>{`"sepete ekle BOUCLE-NORMAL-3 1"`}</li>
              <li>{`"siparişi onayla"`}</li>
            </ul>
          </div>
        ) : null}
        {messages.map((m, i) => <Bubble key={i} msg={m} />)}
        {busy ? (
          <div className="text-xs text-slate-400 italic">Yazıyor…</div>
        ) : null}
        {error ? <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1">{error}</div> : null}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="border-t border-slate-100 p-2 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Bir şey sorun…"
          disabled={busy}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg px-3 text-sm"
        >
          Gönder
        </button>
      </form>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  if (msg.role === "tool") {
    return (
      <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 whitespace-pre-wrap">
        {msg.content}
      </div>
    );
  }
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] px-3 py-2 rounded-2xl whitespace-pre-wrap text-sm ${isUser ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>
        {msg.content}
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  );
}
