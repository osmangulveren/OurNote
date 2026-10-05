import { redirect } from "next/navigation";
import TotalsBox from "@/components/TotalsBox";
import { requireBuyer } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { ALL_COUNTRIES, config } from "@/lib/config";
import { money } from "@/lib/format";
import CheckoutForm from "./CheckoutForm";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireBuyer();
  const { lines, totals } = await getCart(user);
  if (lines.length === 0) redirect("/cart");
  const c = user.company;
  const countries = Object.entries(ALL_COUNTRIES).sort((a, b) => a[1].localeCompare(b[1]));

  return (
    <div className="container-page py-8">
      <h1 className="h1 mb-6">Checkout</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <CheckoutForm
          defaults={{ name: c.name, address: c.address, city: c.city, postal: c.postalCode, country: c.country, phone: c.phone }}
          countries={countries}
          stripeEnabled={config.stripeEnabled}
          total={money(totals.total)}
        />
        <div className="space-y-4">
          <div className="card divide-y divide-slate-100 text-sm">
            {lines.map(({ item, lineTotal }) => (
              <div key={item.id} className="flex justify-between gap-3 p-3">
                <span>{item.quantity} × {item.product.name}{item.color && <span className="text-slate-400"> ({item.color})</span>}</span>
                <span className="font-medium">{money(lineTotal)}</span>
              </div>
            ))}
          </div>
          <TotalsBox totals={totals} />
          <p className="text-xs text-slate-500">
            Invoiced by {config.company.legalName} ({config.company.vat}). Prices in EUR. Goods are shipped from Türkiye; export and EU customs clearance are handled by us.
          </p>
        </div>
      </div>
    </div>
  );
}
