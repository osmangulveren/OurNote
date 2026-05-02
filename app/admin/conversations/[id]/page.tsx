import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

const ROLE_LABEL: Record<string, string> = {
  USER: "Müşteri",
  ASSISTANT: "Asistan",
  TOOL: "Araç",
  SYSTEM: "Sistem",
};

export default async function ConversationDetailPage({ params }: { params: { id: string } }) {
  const convo = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      user: { include: { customerProfile: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!convo) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Konuşma — {convo.user.customerProfile?.companyName ?? convo.user.email}</h1>
          <p className="text-sm text-slate-500">Başlangıç: {convo.createdAt.toLocaleString("tr-TR")} · {convo.messages.length} mesaj</p>
        </div>
        <Link href="/admin/conversations" className="text-sm text-slate-600 hover:underline">← Tüm konuşmalar</Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        {convo.messages.map((m) => (
          <div key={m.id} className="text-sm">
            <div className="flex items-baseline justify-between gap-2 mb-0.5">
              <span className={`text-xs font-medium uppercase ${
                m.role === "USER" ? "text-slate-900" :
                m.role === "ASSISTANT" ? "text-emerald-700" :
                m.role === "TOOL" ? "text-blue-700" : "text-slate-500"
              }`}>
                {ROLE_LABEL[m.role] ?? m.role}{m.toolName ? ` (${m.toolName})` : ""}
              </span>
              <span className="text-[11px] text-slate-400">{m.createdAt.toLocaleString("tr-TR")}</span>
            </div>
            <p className="whitespace-pre-wrap text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2">{m.content}</p>
            {m.toolArgs ? (
              <details className="mt-1 text-xs text-slate-500">
                <summary className="cursor-pointer">Tool args</summary>
                <pre className="bg-slate-100 p-2 rounded mt-1 overflow-x-auto">{JSON.stringify(m.toolArgs, null, 2)}</pre>
              </details>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
