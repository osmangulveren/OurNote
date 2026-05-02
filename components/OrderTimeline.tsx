import { ProductionStage } from "@prisma/client";
import { PRODUCTION_STAGE_LABEL, PRODUCTION_STAGE_ORDER } from "@/lib/orders/productionStages";

interface Event { stage: ProductionStage; createdAt: Date | string; note?: string | null }

export default function OrderTimeline({
  current,
  events,
  cancelled,
}: {
  current: ProductionStage;
  events: Event[];
  cancelled?: boolean;
}) {
  const currentIdx = PRODUCTION_STAGE_ORDER.indexOf(current);
  const eventsByStage = new Map<ProductionStage, Event>();
  for (const e of events) eventsByStage.set(e.stage, e);

  return (
    <ol className="relative border-l border-slate-200 pl-5 space-y-4">
      {PRODUCTION_STAGE_ORDER.map((stage, i) => {
        const reached = !cancelled && i <= currentIdx;
        const isCurrent = !cancelled && i === currentIdx;
        const ev = eventsByStage.get(stage);
        return (
          <li key={stage} className="relative">
            <span
              className={`absolute -left-[27px] top-1 inline-flex w-4 h-4 rounded-full border-2 ${
                cancelled
                  ? "bg-slate-100 border-slate-300"
                  : isCurrent
                  ? "bg-emerald-500 border-emerald-500 ring-4 ring-emerald-100"
                  : reached
                  ? "bg-emerald-500 border-emerald-500"
                  : "bg-white border-slate-300"
              }`}
            />
            <div className={reached ? "" : "opacity-60"}>
              <div className="flex items-baseline justify-between gap-3">
                <p className={`text-sm font-medium ${isCurrent ? "text-emerald-700" : reached ? "text-slate-900" : "text-slate-500"}`}>
                  {PRODUCTION_STAGE_LABEL[stage]}
                </p>
                {ev ? (
                  <span className="text-[11px] text-slate-400">
                    {new Date(ev.createdAt).toLocaleString("tr-TR")}
                  </span>
                ) : null}
              </div>
              {ev?.note ? <p className="text-xs text-slate-600 mt-0.5">{ev.note}</p> : null}
            </div>
          </li>
        );
      })}
      {cancelled ? (
        <li className="text-sm text-red-700 font-medium pl-1">Sipariş iptal edildi.</li>
      ) : null}
    </ol>
  );
}
