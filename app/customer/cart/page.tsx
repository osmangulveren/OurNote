import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/session";
import { D, formatTRY, round2 } from "@/lib/money";
import { effectiveUnitPrice, loadCustomerPricingContext } from "@/lib/pricing";
import CartTable from "./CartTable";
import CheckoutPanel from "./CheckoutPanel";

export default async function CartPage() {
  const session = await requireCustomer();
  const userId = session.user!.id;

  const [cart, ctx] = await Promise.all([
    prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
    }),
    loadCustomerPricingContext(prisma, userId),
  ]);

  let subtotal = new D(0);
  let vat = new D(0);
  const enrichedItems = cart.items.map((i) => {
    const config = (i.configuration as any) ?? null;
    const compMul = Number(config?.composition?.priceMultiplier ?? 1);
    const addonsDelta = Array.isArray(config?.addons)
      ? config.addons.reduce((s: number, a: any) => s + Number(a?.priceDelta ?? 0), 0)
      : 0;
    const baseUnit = effectiveUnitPrice(i.product.price as any, i.productId, ctx);
    const unit = round2(baseUnit.mul(compMul).add(new D(addonsDelta)));
    const lineSub = round2(unit.mul(i.quantity));
    const lineVat = round2(lineSub.mul(i.product.vatRate).div(100));
    subtotal = subtotal.add(lineSub);
    vat = vat.add(lineVat);
    return {
      id: i.id,
      productId: i.productId,
      name: i.product.name,
      sku: i.product.sku,
      unit: i.product.unit,
      quantity: i.quantity,
      available: i.product.stockQuantity - i.product.reservedQuantity + i.quantity,
      unitPrice: unit.toFixed(2),
      basePrice: baseUnit.toFixed(2),
      vatRate: i.product.vatRate.toString(),
      configurationSummary: config?.summary ?? null,
      configurationColor: config?.fabricColor ?? null,
    };
  });
  const grand = round2(subtotal.add(vat));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sepetim</h1>
      {cart.items.length === 0 ? (
        <p className="text-slate-500">Sepetiniz boş.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2"><CartTable items={enrichedItems} /></div>
          <CheckoutPanel
            subtotal={formatTRY(subtotal)}
            vat={formatTRY(vat)}
            grand={formatTRY(grand)}
          />
        </div>
      )}
    </div>
  );
}
