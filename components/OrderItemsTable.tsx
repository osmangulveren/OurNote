import { fabricOf } from "@/lib/fabrics";
import { money } from "@/lib/format";

type Item = { id: string; sku: string; name: string; color: string; unitPrice: number; quantity: number; lineTotal: number };

export default function OrderItemsTable({ items }: { items: Item[] }) {
  return (
    <table className="table">
      <thead><tr><th>Piece</th><th>Fabric</th><th className="text-right">Qty</th><th className="text-right">Unit</th><th className="text-right">Total</th></tr></thead>
      <tbody>
        {items.map((i) => (
          <tr key={i.id}>
            <td><div className="font-medium">{i.name}</div><div className="font-mono text-[10px] text-stone">{i.sku}</div></td>
            <td>{i.color ? <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: fabricOf(i.color).hex }} />{i.color}</span> : "—"}</td>
            <td className="num text-right">{i.quantity}</td>
            <td className="num text-right">{money(i.unitPrice)}</td>
            <td className="num text-right">{money(i.lineTotal)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
