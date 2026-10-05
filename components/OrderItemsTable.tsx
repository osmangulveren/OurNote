import { money } from "@/lib/format";

type Item = { id: string; sku: string; name: string; color: string; unitPrice: number; quantity: number; lineTotal: number };

export default function OrderItemsTable({ items }: { items: Item[] }) {
  return (
    <table className="table">
      <thead><tr><th>SKU</th><th>Product</th><th className="text-right">Qty</th><th className="text-right">Unit</th><th className="text-right">Total</th></tr></thead>
      <tbody>
        {items.map((i) => (
          <tr key={i.id}>
            <td className="font-mono text-xs">{i.sku}</td>
            <td>{i.name}{i.color && <span className="text-slate-400"> · {i.color}</span>}</td>
            <td className="text-right">{i.quantity}</td>
            <td className="text-right">{money(i.unitPrice)}</td>
            <td className="text-right font-semibold">{money(i.lineTotal)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
