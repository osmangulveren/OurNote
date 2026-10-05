// Order lifecycle shown to buyers, in order.
export const ORDER_STEPS = [
  { key: "PENDING_PAYMENT", label: "Order placed", hint: "Waiting for payment" },
  { key: "CONFIRMED", label: "Payment confirmed", hint: "Your order is confirmed" },
  { key: "IN_PRODUCTION", label: "In production", hint: "Being produced / prepared by our workshops" },
  { key: "LOADING", label: "Loading", hint: "Being loaded onto the truck in Türkiye" },
  { key: "IN_TRANSIT", label: "On the road", hint: "The truck is on its way" },
  { key: "CUSTOMS", label: "Customs", hint: "Customs clearance at the EU border" },
  { key: "OUT_FOR_DELIVERY", label: "Out for delivery", hint: "The truck is heading to your store" },
  { key: "DELIVERED", label: "Delivered", hint: "Delivered to your store" },
] as const;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  ...Object.fromEntries(ORDER_STEPS.map((s) => [s.key, s.label])),
  CANCELLED: "Cancelled",
};

export const ORDER_STATUSES = [...ORDER_STEPS.map((s) => s.key), "CANCELLED"] as string[];

export function orderStepIndex(status: string) {
  return ORDER_STEPS.findIndex((s) => s.key === status);
}

// Truck (TIR) stages, and the order status each one implies for orders on board.
export const SHIPMENT_STAGES = [
  { key: "PLANNED", label: "Planned", orderStatus: null },
  { key: "LOADING", label: "Loading in Türkiye", orderStatus: "LOADING" },
  { key: "DEPARTED", label: "Departed", orderStatus: "IN_TRANSIT" },
  { key: "AT_BORDER", label: "At border / customs", orderStatus: "CUSTOMS" },
  { key: "CUSTOMS_CLEARED", label: "Customs cleared", orderStatus: "IN_TRANSIT" },
  { key: "IN_TRANSIT_EU", label: "In transit (EU)", orderStatus: "IN_TRANSIT" },
  { key: "DELIVERING", label: "Delivering to stores", orderStatus: "OUT_FOR_DELIVERY" },
  { key: "COMPLETED", label: "Completed", orderStatus: null },
] as const;

export const SHIPMENT_STAGE_LABEL: Record<string, string> = Object.fromEntries(
  SHIPMENT_STAGES.map((s) => [s.key, s.label]),
);

export function statusTone(status: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "bg-amber-100 text-amber-800";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    case "DELIVERED":
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-800";
    case "CUSTOMS":
    case "AT_BORDER":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-brand-100 text-brand-700";
  }
}
