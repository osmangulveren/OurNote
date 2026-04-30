import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/session";
import { D, formatTRY, round2 } from "@/lib/money";
import { effectiveUnitPrice, loadCustomerPricingContext } from "@/lib/pricing";
import CartTable from "./CartTable";
import PlaceOrderButton from "./PlaceOrderButton";

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
    const unit = effectiveUnitPrice(i.product.price as any, i.productId, ctx);
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
      listPrice: i.product.price.toString(),
      vatRate: i.product.vatRate.toString(),
    };
  });
  const grand = round2(subtotal.add(vat));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Sepetim</h1>
      {cart.items.length === 0 ? (
        <p className="text-slate-500">Sepetiniz boş.</p>
      ) : (
        <>
          <CartTable items={enrichedItems} />
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-sm ml-auto space-y-2 text-sm">
            <Row label="Ara Toplam" value={formatTRY(subtotal)} />
            <Row label="KDV" value={formatTRY(vat)} />
            <Row label="Genel Toplam" value={formatTRY(grand)} bold />
            <PlaceOrderButton />
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : "text-slate-600"}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
