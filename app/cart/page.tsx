import Link from "next/link";
import { Reveal, SplitHeading } from "@/components/motion/Reveal";
import TotalsBox from "@/components/TotalsBox";
import { TrailerStage } from "@/components/three";
import { removeCartItem, updateCartItem } from "@/app/actions/cart";
import { requireBuyer } from "@/lib/auth";
import { getCart, planItems } from "@/lib/cart";
import { config } from "@/lib/config";
import { fabricOf } from "@/lib/fabrics";
import { money } from "@/lib/format";

export const metadata = { title: "Your load" };

export default async function CartPage() {
  const user = await requireBuyer();
  const { lines, totals } = await getCart(user);

  if (lines.length === 0) {
    return (
      <div className="container-page pb-10 pt-40 text-center">
        <SplitHeading text="Your truck is *empty.*" className="display text-6xl" />
        <p className="muted mt-4">Add pieces from the collection — you&apos;ll see them loaded here in 3D.</p>
        <Link href="/catalog" className="btn-primary mt-8">Browse the collection</Link>
      </div>
    );
  }
  const fill = (totals.volume / config.truckCapacityCbm) * 100;

  return (
    <div className="pt-24 md:pt-28">
      <div className="container-page">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Reveal className="eyebrow mb-3">{lines.length} lines · {totals.volume.toFixed(2)} m³ · {fill.toFixed(1)}% of a 13.6 m trailer</Reveal>
            <SplitHeading text="Your *load.*" className="display text-[clamp(3rem,7vw,6rem)]" />
          </div>
          <Link href="/checkout" className="btn-accent px-6 py-3">Choose a truck & check out →</Link>
        </div>
      </div>

      <Reveal className="relative">
        <TrailerStage items={planItems(lines)} className="h-[380px] w-full sm:h-[460px]" />
        <div className="container-page pointer-events-none absolute inset-x-0 bottom-4 flex justify-between font-mono text-[10px] uppercase tracking-wider text-stone">
          <span>Drag to orbit · scroll to zoom</span>
          <span>Front of trailer ← cab</span>
        </div>
      </Reveal>

      <div className="container-page mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="border-t border-line">
          {lines.map(({ item, unitPrice, lineTotal }) => (
            <div key={item.id} className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 border-b border-line py-5 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:items-center">
              <span className="h-12 w-12 rounded-full ring-1 ring-line" style={{ background: fabricOf(item.color || "Sand Velvet").hex }} title={item.color} />
              <div className="min-w-0">
                <Link href={`/products/${item.product.slug}`} className="font-display text-2xl leading-none hover:text-clay">{item.product.name}</Link>
                <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-stone">
                  {item.product.sku}{item.color && ` · ${item.color}`} · {(item.product.volumeM3 * item.quantity).toFixed(2)} m³
                </div>
              </div>
              <form action={updateCartItem} className="col-span-2 flex items-center gap-2 sm:col-span-1">
                <input type="hidden" name="id" value={item.id} />
                <input name="quantity" type="number" min={item.product.moq} defaultValue={item.quantity} className="input num w-20 rounded-full text-center" />
                <button className="btn-ghost text-xs">Update</button>
              </form>
              <div className="text-right sm:w-32">
                <div className="num">{money(lineTotal)}</div>
                <div className="font-mono text-[10px] text-stone">{money(unitPrice)} / {item.product.unit}</div>
              </div>
              <form action={removeCartItem} className="text-right">
                <input type="hidden" name="id" value={item.id} />
                <button className="grid h-8 w-8 place-items-center rounded-full text-stone hover:bg-clay-3 hover:text-clay-2" aria-label="Remove">✕</button>
              </form>
            </div>
          ))}
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <TotalsBox totals={totals}>
            <Link href="/checkout" className="btn-accent mt-2 w-full py-3">Choose a truck →</Link>
          </TotalsBox>
        </div>
      </div>
    </div>
  );
}
