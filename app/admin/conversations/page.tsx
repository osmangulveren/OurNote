import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminConversationsPage() {
  const conversations = await prisma.conversation.findMany({
    include: {
      user: { include: { customerProfile: true } },
      _count: { select: { messages: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Asistan Konuşmaları</h1>
      <p className="text-sm text-slate-500">Müşterilerin AI asistanla yaptığı tüm konuşmalar.</p>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2">Müşteri</th>
              <th className="px-4 py-2">Son Mesaj</th>
              <th className="px-4 py-2 text-right">Mesaj Sayısı</th>
              <th className="px-4 py-2">Son Güncelleme</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {conversations.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-4 text-slate-500">Henüz konuşma yok.</td></tr>
            ) : conversations.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  <div className="font-medium">{c.user.customerProfile?.companyName ?? c.user.name ?? c.user.email}</div>
                  <div className="text-xs text-slate-500">{c.user.email}</div>
                </td>
                <td className="px-4 py-2 max-w-md text-xs text-slate-700 truncate">{c.messages[0]?.content ?? "—"}</td>
                <td className="px-4 py-2 text-right">{c._count.messages}</td>
                <td className="px-4 py-2 text-xs text-slate-500">{c.updatedAt.toLocaleString("tr-TR")}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/conversations/${c.id}`} className="text-xs text-slate-700 hover:underline">Aç →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
