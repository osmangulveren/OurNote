import Link from "next/link";
import Countdown from "@/components/motion/Countdown";
import { date } from "@/lib/format";
import type { Departure } from "@/lib/orders";

/** Upcoming shared trucks with live space and booking deadline. */
export default function Departures({ items, dark = false }: { items: Departure[]; dark?: boolean }) {
  if (items.length === 0) {
    return <p className={dark ? "text-stone-2" : "muted"}>No open trucks right now — new departures are added weekly.</p>;
  }
  return (
    <div className={`divide-y ${dark ? "divide-white/10" : "divide-line"}`}>
      {items.map((d) => {
        const pct = Math.min(100, (d.booked / d.capacity) * 100);
        const stops = d.route.split("→").map((s) => s.trim());
        return (
          <div key={d.id} className="grid gap-4 py-6 md:grid-cols-[1.1fr_1.6fr_1fr] md:items-center">
            <div>
              <div className="font-mono text-xs tracking-wider text-stone">{d.code}</div>
              <div className="mt-1 font-display text-3xl leading-none">Departs {date(d.plannedDepartureAt)}</div>
              <div className={`mt-1 text-sm ${dark ? "text-stone-2" : "text-ink-3"}`}>At stores from {date(d.eta)}</div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                {stops.map((s, i) => (
                  <span key={i} className="flex items-center gap-2">
                    <span className={i === 0 || i === stops.length - 1 ? "" : dark ? "text-stone-2" : "text-ink-3"}>{s}</span>
                    {i < stops.length - 1 && <span className="h-px w-4 bg-current opacity-30" />}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className={`h-1.5 flex-1 overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-line"}`}>
                  <div className="h-full rounded-full bg-clay" style={{ width: `${pct}%` }} />
                </div>
                <span className="num whitespace-nowrap text-xs">{d.free.toFixed(0)} m³ free</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 md:justify-end">
              {d.cutoffAt && (
                <div className="text-right">
                  <div className="eyebrow">Booking closes in</div>
                  <Countdown to={d.cutoffAt} className="text-lg" />
                </div>
              )}
              <Link href="/catalog" className={dark ? "btn bg-paper text-ink hover:bg-bone" : "btn-outline"}>Fill it</Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
