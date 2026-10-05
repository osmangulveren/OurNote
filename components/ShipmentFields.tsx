type S = { truckPlate?: string; trailerPlate?: string; driverName?: string; driverPhone?: string; carrier?: string; route?: string; eta?: Date | null };

export default function ShipmentFields({ s }: { s?: S }) {
  const eta = s?.eta ? new Date(s.eta).toISOString().slice(0, 10) : "";
  return (
    <>
      <div><label className="label">Truck plate</label><input name="truckPlate" required defaultValue={s?.truckPlate} className="input" /></div>
      <div><label className="label">Trailer plate</label><input name="trailerPlate" defaultValue={s?.trailerPlate} className="input" /></div>
      <div><label className="label">Carrier</label><input name="carrier" defaultValue={s?.carrier} className="input" /></div>
      <div><label className="label">Driver</label><input name="driverName" defaultValue={s?.driverName} className="input" /></div>
      <div><label className="label">Driver phone (shown to buyers)</label><input name="driverPhone" defaultValue={s?.driverPhone} className="input" /></div>
      <div><label className="label">ETA</label><input name="eta" type="date" defaultValue={eta} className="input" /></div>
      <div className="sm:col-span-3"><label className="label">Route</label><input name="route" defaultValue={s?.route ?? "Istanbul → Kapıkule → Sofia → Bucharest → "} className="input" /></div>
    </>
  );
}
