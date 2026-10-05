import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import TotalsBox from "@/components/TotalsBox";
import { removeCartItem, updateCartItem } from "@/app/actions/cart";
import { requireBuyer } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { money, parseJson } from "@/lib/format";

export const metadata = { title: "Cart" };

export default async function CartPage() {
  const user = await requireBuyer();
  const { lines, totals } = await getCart(user);

  if (lines.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="h1 mb-2">Your cart is empty</h1>
        <p className="muted mb-6">Browse the catalog and add products in wholesale quantities.</p>
        <Link href="/catalog" className="btn-primary">Go to catalog</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="h1 mb-6">Cart</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="card divide-y divide-slate-100">
          {lines.map(({ item, unitPrice, lineTotal }) => (
            <div key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg">
                <ProductImage src={parseJson<string[]>(item.product.images, [])[0]} name={item.product.name} category={item.product.category.slug} />
              </div>
              <div className="flex-1">
                <Link href={`/products/${item.product.slug}`} className="font-semibold hover:text-brand-600">{item.product.name}</Link>
                <div className="text-xs text-slate-500">
                  {item.product.sku}{item.color && ` · ${item.color}`} · {money(unitPrice)} / {item.product.unit} · MOQ {item.product.moq}
                </div>
              </div>
              <form action={updateCartItem} className="flex items-center gap-2">
                <input type="hidden" name="id" value={item.id} />
                <input name="quantity" type="number" min={item.product.moq} defaultValue={item.quantity} className="input w-20 text-center" />
                <button className="btn-outline px-3 py-1.5 text-xs">Update</button>
              </form>
              <div className="w-28 text-right font-semibold">{money(lineTotal)}</div>
              <form action={removeCartItem}>
                <input type="hidden" name="id" value={item.id} />
                <button className="text-xs text-slate-400 hover:text-red-600" aria-label="Remove">✕</button>
              </form>
            </div>
          ))}
        </div>
        <div>
          <TotalsBox totals={totals}>
            <Link href="/checkout" className="btn-accent mt-2 w-full">Proceed to checkout</Link>
          </TotalsBox>
        </div>
      </div>
    </div>
  );
}
