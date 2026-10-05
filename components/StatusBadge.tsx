import { ORDER_STATUS_LABEL, SHIPMENT_STAGE_LABEL, statusTone } from "@/lib/status";

export default function StatusBadge({ status, kind = "order" }: { status: string; kind?: "order" | "shipment" }) {
  const label = (kind === "order" ? ORDER_STATUS_LABEL : SHIPMENT_STAGE_LABEL)[status] ?? status;
  return <span className={`badge ${statusTone(status)}`}>{label}</span>;
}
