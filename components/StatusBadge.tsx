import { ORDER_STATUS_LABEL, SHIPMENT_STAGE_LABEL } from "@/lib/status";

const tone = (s: string) =>
  s === "PENDING_PAYMENT" ? "bg-sand/50 text-ink-2"
  : s === "CANCELLED" ? "bg-clay-3 text-clay-2"
  : s === "DELIVERED" || s === "COMPLETED" ? "bg-moss-2 text-moss"
  : s === "CUSTOMS" || s === "AT_BORDER" ? "bg-clay-3 text-clay-2"
  : "bg-ink text-paper";

export default function StatusBadge({ status, kind = "order" }: { status: string; kind?: "order" | "shipment" }) {
  const label = (kind === "order" ? ORDER_STATUS_LABEL : SHIPMENT_STAGE_LABEL)[status] ?? status;
  return (
    <span className={`badge align-middle font-sans tracking-normal ${tone(status)}`}>
      {!["DELIVERED", "COMPLETED", "CANCELLED", "PENDING_PAYMENT", "PLANNED"].includes(status) && <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-current" />}
      {label}
    </span>
  );
}
