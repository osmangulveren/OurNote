import { dateTime } from "@/lib/format";
import { ORDER_STEPS, orderStepIndex } from "@/lib/status";

/** Horizontal progress stepper for an order. */
export function OrderStepper({ status, events }: { status: string; events: { status: string; createdAt: Date }[] }) {
  if (status === "CANCELLED") {
    return <div className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700">This order was cancelled.</div>;
  }
  const current = orderStepIndex(status);
  const reachedAt = (key: string) => events.filter((e) => e.status === key).at(-1)?.createdAt;
  return (
    <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {ORDER_STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const at = reachedAt(s.key);
        return (
          <li key={s.key} className="flex flex-col gap-2">
            <div className={`h-1.5 rounded-full ${done || active ? "bg-brand-600" : "bg-slate-200"}`} />
            <div className="flex items-start gap-2">
              <span
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                  done ? "bg-brand-600 text-white" : active ? "bg-accent-500 text-white ring-4 ring-accent-500/20" : "bg-slate-200 text-slate-500"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <div>
                <div className={`text-xs font-semibold ${active ? "text-slate-900" : done ? "text-slate-700" : "text-slate-400"}`}>{s.label}</div>
                {at && (done || active) && <div className="text-[11px] text-slate-400">{dateTime(at)}</div>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const ROUTE_POINTS = [
  { label: "Workshop, Türkiye", stages: ["PLANNED", "LOADING"] },
  { label: "Departed", stages: ["DEPARTED"] },
  { label: "EU border / customs", stages: ["AT_BORDER"] },
  { label: "Through the EU", stages: ["CUSTOMS_CLEARED", "IN_TRANSIT_EU"] },
  { label: "Your store", stages: ["DELIVERING", "COMPLETED"] },
];

/** Stylised truck route showing where the truck currently is. */
export function TruckRoute({ stage, delivered }: { stage: string; delivered?: boolean }) {
  const idx = delivered ? ROUTE_POINTS.length - 1 : Math.max(0, ROUTE_POINTS.findIndex((p) => p.stages.includes(stage)));
  const pct = (idx / (ROUTE_POINTS.length - 1)) * 100;
  return (
    <div className="px-2 pb-2 pt-10">
      <div className="relative h-2 rounded-full bg-slate-200">
        <div className="absolute inset-y-0 left-0 rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
        {ROUTE_POINTS.map((p, i) => (
          <div key={p.label} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${(i / (ROUTE_POINTS.length - 1)) * 100}%` }}>
            <div className={`h-4 w-4 rounded-full border-2 ${i <= idx ? "border-brand-600 bg-white" : "border-slate-300 bg-white"}`} />
          </div>
        ))}
        <div className="absolute -top-9 -translate-x-1/2 text-2xl" style={{ left: `${pct}%` }} aria-label="Truck position">
          🚚
        </div>
      </div>
      <div className="mt-3 flex justify-between gap-2 text-[11px] font-medium text-slate-500">
        {ROUTE_POINTS.map((p, i) => (
          <span key={p.label} className={`w-16 text-center sm:w-24 ${i === idx ? "font-bold text-slate-900" : ""} ${i === 0 ? "text-left" : i === ROUTE_POINTS.length - 1 ? "text-right" : ""}`}>
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}
