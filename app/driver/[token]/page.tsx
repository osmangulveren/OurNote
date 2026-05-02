import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DriverBeacon from "./DriverBeacon";

export default async function DriverPortalPage({ params }: { params: { token: string } }) {
  const shipment = await prisma.shipment.findUnique({
    where: { trackingToken: params.token },
    include: { order: { include: { user: { include: { customerProfile: true } } } } },
  });
  if (!shipment) notFound();

  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 flex flex-col">
      <div className="max-w-md w-full mx-auto space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <h1 className="text-lg font-semibold">Şoför Paneli</h1>
          <p className="text-xs text-slate-300">Bu sayfayı kapatmadan tutun. Konumunuz her 30 saniyede gönderilir.</p>
        </div>

        <div className="bg-white text-slate-900 rounded-2xl p-4 space-y-2 text-sm">
          <Row label="Sipariş" value={shipment.order.orderNumber} />
          <Row label="Müşteri" value={shipment.order.user.customerProfile?.companyName ?? shipment.order.user.email} />
          <Row label="TIR Plakası" value={shipment.truckPlate} />
          <Row label="Şoför" value={shipment.driverName} />
          {shipment.etaAt ? <Row label="Tahmini Varış" value={new Date(shipment.etaAt).toLocaleString("tr-TR")} /> : null}
          <Row label="Durum" value={shipment.status} />
        </div>

        <DriverBeacon token={params.token} active={shipment.status !== "DELIVERED" && shipment.status !== "CANCELLED"} />

        <p className="text-[11px] text-slate-400 text-center pt-4">
          Konum verisi sadece bu sevkiyat için kullanılır. Sürüş esnasında telefonu kullanmayın.
        </p>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-1 border-b border-slate-100 last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
