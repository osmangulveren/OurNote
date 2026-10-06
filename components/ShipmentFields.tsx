type S = { bookable?: boolean; cutoffAt?: Date | null; plannedDepartureAt?: Date | null; capacityM3?: number; truckPlate?: string; trailerPlate?: string; driverName?: string; driverPhone?: string; carrier?: string; route?: string; eta?: Date | null };

export default function ShipmentFields({ s }: { s?: S }) {
  const day = (d?: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");
  const eta = day(s?.eta);
  return (
    <>
      <div><label className="label">Truck plate</label><input name="truckPlate" required defaultValue={s?.truckPlate} className="input" /></div>
      <div><label className="label">Trailer plate</label><input name="trailerPlate" defaultValue={s?.trailerPlate} className="input" /></div>
      <div><label className="label">Carrier</label><input name="carrier" defaultValue={s?.carrier} className="input" /></div>
      <div><label className="label">Driver</label><input name="driverName" defaultValue={s?.driverName} className="input" /></div>
      <div><label className="label">Driver phone (shown to buyers)</label><input name="driverPhone" defaultValue={s?.driverPhone} className="input" /></div>
      <div><label className="label">ETA</label><input name="eta" type="date" defaultValue={eta} className="input" /></div>
      <div><label className="label">Planned departure</label><input name="plannedDepartureAt" type="date" defaultValue={day(s?.plannedDepartureAt)} className="input" /></div>
      <div><label className="label">Booking closes</label><input name="cutoffAt" type="date" defaultValue={day(s?.cutoffAt)} className="input" /></div>
      <div><label className="label">Usable capacity m³</label><input name="capacityM3" type="number" step="any" defaultValue={s?.capacityM3 ?? 82} className="input" /></div>
      <label className="flex items-center gap-2 text-sm sm:col-span-3"><input type="checkbox" name="bookable" defaultChecked={s?.bookable ?? true} className="accent-ink" /> Open for booking — stores can choose this truck at checkout</label>
      <div className="sm:col-span-3"><label className="label">Route</label><input name="route" defaultValue={s?.route ?? "Istanbul → Kapıkule → Sofia → Bucharest → "} className="input" /></div>
    </>
  );
}
