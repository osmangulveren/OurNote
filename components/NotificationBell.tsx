"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";

interface Item {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [, start] = useTransition();

  async function fetchData() {
    try {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      if (!r.ok) return;
      const data = await r.json();
      setUnread(data.unread ?? 0);
      setItems(data.items ?? []);
    } catch { /* ağ hatası — sessiz */ }
  }

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, []);

  function markAllRead() {
    start(async () => {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
      fetchData();
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((o) => !o); if (!open) fetchData(); }}
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-300 hover:bg-slate-100"
        aria-label="Bildirimler"
      >
        <Bell />
        {unread > 0 ? (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
            <h3 className="text-sm font-semibold">Bildirimler</h3>
            {unread > 0 ? (
              <button onClick={markAllRead} className="text-xs text-slate-600 hover:underline">
                Tümünü okundu işaretle
              </button>
            ) : null}
          </div>
          <ul className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {items.length === 0 ? (
              <li className="p-4 text-sm text-slate-500 text-center">Bildirim yok.</li>
            ) : items.map((n) => (
              <li key={n.id} className={n.readAt ? "" : "bg-slate-50"}>
                <NotificationRow item={n} onClick={() => setOpen(false)} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function NotificationRow({ item, onClick }: { item: Item; onClick: () => void }) {
  const inner = (
    <div className="px-3 py-2 hover:bg-slate-50 cursor-pointer">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-slate-900">{item.title}</p>
        <span className="text-[11px] text-slate-400 whitespace-nowrap">{new Date(item.createdAt).toLocaleString("tr-TR")}</span>
      </div>
      {item.body ? <p className="text-xs text-slate-600 mt-0.5">{item.body}</p> : null}
    </div>
  );
  return item.link ? (
    <Link href={item.link} onClick={onClick}>{inner}</Link>
  ) : <div onClick={onClick}>{inner}</div>;
}

function Bell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
