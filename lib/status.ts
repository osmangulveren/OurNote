// Order lifecycle shown to buyers, in order.
export const ORDER_STEPS = [
  { key: "PENDING_PAYMENT", label: "Placed" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "IN_PRODUCTION", label: "In production" },
  { key: "LOADING", label: "Loading" },
  { key: "IN_TRANSIT", label: "On the road" },
  { key: "CUSTOMS", label: "At the border" },
  { key: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { key: "DELIVERED", label: "Delivered" },
] as const;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  ...Object.fromEntries(ORDER_STEPS.map((s) => [s.key, s.label])),
  PENDING_PAYMENT: "Awaiting payment",
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

export const SHIPMENT_STAGE_LABEL: Record<string, string> = Object.fromEntries(SHIPMENT_STAGES.map((s) => [s.key, s.label]));

export const PAYMENT_LABEL: Record<string, string> = {
  UNPAID: "Unpaid",
  DEPOSIT_PAID: "Deposit paid",
  PAID: "Paid",
  REFUNDED: "Refunded",
};

/** Stage to show on the map for an order (uses its truck if it has one). */
export function mapStage(orderStatus: string, shipmentStage?: string | null) {
  if (orderStatus === "DELIVERED") return "DELIVERED";
  if (shipmentStage && shipmentStage !== "PLANNED") return shipmentStage;
  return orderStatus === "LOADING" ? "LOADING" : "PLANNED";
}
