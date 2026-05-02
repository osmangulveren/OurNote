import { prisma } from "@/lib/prisma";

const ACTION_LABEL: Record<string, string> = {
  ORDER_STATUS_CHANGE: "Sipariş Durumu",
  PRODUCTION_STAGE_ADVANCE: "Üretim Aşaması",
  SHIPMENT_UPSERT: "Sevkiyat",
  DELIVERY_NOTE_CREATE: "İrsaliye",
};

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <p className="text-sm text-slate-500">Tüm admin aksiyonlarının kim / ne zaman / hangi kayıt üzerinde yapıldığının izi.</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2">Zaman</th>
              <th className="px-4 py-2">Kullanıcı</th>
              <th className="px-4 py-2">Aksiyon</th>
              <th className="px-4 py-2">Kayıt</th>
              <th className="px-4 py-2">Detay</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-4 text-slate-500">Henüz kayıt yok.</td></tr>
            ) : logs.map((l) => (
              <tr key={l.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">{l.createdAt.toLocaleString("tr-TR")}</td>
                <td className="px-4 py-2 text-xs">{l.actorEmail ?? "—"}</td>
                <td className="px-4 py-2">
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{ACTION_LABEL[l.action] ?? l.action}</span>
                </td>
                <td className="px-4 py-2 text-xs">
                  <span className="text-slate-500">{l.entityType}</span>
                  {l.entityId ? <span className="font-mono ml-1">{l.entityId.slice(0, 10)}…</span> : null}
                </td>
                <td className="px-4 py-2 text-xs text-slate-700">
                  {l.payload ? <code className="bg-slate-50 px-1 py-0.5 rounded">{JSON.stringify(l.payload)}</code> : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
