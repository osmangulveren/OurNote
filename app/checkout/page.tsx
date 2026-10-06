import { redirect } from "next/navigation";
import { SplitHeading } from "@/components/motion/Reveal";
import TotalsBox from "@/components/TotalsBox";
import { requireBuyer } from "@/lib/auth";
import { getCart, planItems } from "@/lib/cart";
import { ALL_COUNTRIES, config } from "@/lib/config";
import { money } from "@/lib/format";
import { bookableDepartures, readyDate } from "@/lib/orders";
import CheckoutForm from "./CheckoutForm";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireBuyer();
  const { lines, totals, maxLead } = await getCart(user);
  if (lines.length === 0) redirect("/cart");
  const c = user.company;
  const countries = Object.entries(ALL_COUNTRIES).sort((a, b) => a[1].localeCompare(b[1]));
  const departures = await bookableDepartures();

  return (
    <div className="container-page pt-24 md:pt-28">
      <SplitHeading text="Check *out.*" className="display mb-10 text-[clamp(3rem,7vw,6rem)]" />
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <CheckoutForm
          defaults={{ name: c.name, address: c.address, city: c.city, postal: c.postalCode, country: c.country, phone: c.phone }}
          countries={countries}
          stripeEnabled={config.stripeEnabled}
          total={totals.total}
          volume={totals.volume}
          depositPercent={config.depositPercent}
          readyBy={readyDate(maxLead).toISOString()}
          mine={planItems(lines)}
          departures={departures.map((x) => ({
            id: x.id, code: x.code, route: x.route, departAt: x.plannedDepartureAt?.toISOString() ?? null, eta: x.eta?.toISOString() ?? null,
            cutoffAt: x.cutoffAt?.toISOString() ?? null, booked: x.booked, free: x.free, capacity: x.capacity, stores: x.stores,
          }))}
        />
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="panel divide-y divide-line-2 text-sm">
            {lines.map(({ item, lineTotal }) => (
              <div key={item.id} className="flex justify-between gap-3 px-5 py-3">
                <span><span className="num">{item.quantity}×</span> {item.product.name}{item.color && <span className="text-stone"> · {item.color}</span>}</span>
                <span className="num">{money(lineTotal)}</span>
              </div>
            ))}
          </div>
          <TotalsBox totals={totals} />
          <p className="px-1 text-xs leading-relaxed text-stone">
            Seller: {config.company.legalName} ({config.company.vat}). Goods originate in Türkiye and travel under the EU–Türkiye customs union with an A.TR certificate; we handle export and import clearance.
          </p>
        </div>
      </div>
    </div>
  );
}
