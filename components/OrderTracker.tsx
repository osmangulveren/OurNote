import { dateTime } from "@/lib/format";
import { ORDER_STEPS, orderStepIndex } from "@/lib/status";

/** Progress through the order lifecycle. */
export function OrderStepper({ status, events }: { status: string; events: { status: string; createdAt: Date }[] }) {
  if (status === "CANCELLED") {
    return <div className="rounded-xl bg-clay-3 p-4 text-sm text-clay-2">This order was cancelled.</div>;
  }
  const current = orderStepIndex(status);
  const reachedAt = (key: string) => events.filter((e) => e.status === key).at(-1)?.createdAt;
  return (
    <ol className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-8">
      {ORDER_STEPS.map((s, i) => {
        const done = i < current, active = i === current;
        const at = reachedAt(s.key);
        return (
          <li key={s.key} className="relative">
            <div className="mb-3 flex items-center gap-2">
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[10px] ${done ? "bg-ink text-paper" : active ? "bg-clay text-paper ring-4 ring-clay/20" : "bg-line text-stone"}`}>
                {done ? "✓" : String(i + 1).padStart(2, "0")}
              </span>
              <span className={`h-px flex-1 ${done ? "bg-ink" : "bg-line"}`} />
            </div>
            <div className={`text-sm ${active ? "font-medium text-ink" : done ? "text-ink-2" : "text-stone"}`}>{s.label}</div>
            {at && (done || active) && <div className="num text-[11px] text-stone">{dateTime(at)}</div>}
          </li>
        );
      })}
    </ol>
  );
}

const ROUTE_POINTS = [
  { label: "Workshop", stages: ["PLANNED", "LOADING"] },
  { label: "Departed", stages: ["DEPARTED"] },
  { label: "Border", stages: ["AT_BORDER"] },
  { label: "EU roads", stages: ["CUSTOMS_CLEARED", "IN_TRANSIT_EU"] },
  { label: "Stores", stages: ["DELIVERING", "COMPLETED"] },
];

/** Compact horizontal truck progress (admin). */
export function TruckRoute({ stage }: { stage: string }) {
  const idx = Math.max(0, ROUTE_POINTS.findIndex((p) => p.stages.includes(stage)));
  const pct = (idx / (ROUTE_POINTS.length - 1)) * 100;
  return (
    <div className="px-2 pt-2">
      <div className="relative h-1 rounded-full bg-line">
        <div className="absolute inset-y-0 left-0 rounded-full bg-clay" style={{ width: `${pct}%` }} />
        {ROUTE_POINTS.map((p, i) => (
          <span key={p.label} className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${i <= idx ? "border-clay bg-paper" : "border-line bg-paper"}`} style={{ left: `${(i / (ROUTE_POINTS.length - 1)) * 100}%` }} />
        ))}
      </div>
      <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-wider text-stone">
        {ROUTE_POINTS.map((p, i) => <span key={p.label} className={i === idx ? "text-ink" : ""}>{p.label}</span>)}
      </div>
    </div>
  );
}
