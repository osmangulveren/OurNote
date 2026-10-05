import ShipmentFields from "@/components/ShipmentFields";
import { createShipment } from "@/app/actions/admin";

export const metadata = { title: "Plan a truck" };

export default function NewShipment() {
  return (
    <div className="space-y-6">
      <h1 className="h1">Plan a truck</h1>
      <form action={createShipment} className="card grid gap-4 p-6 sm:grid-cols-3">
        <ShipmentFields />
        <button className="btn-primary sm:col-span-3">Create truck</button>
      </form>
    </div>
  );
}
