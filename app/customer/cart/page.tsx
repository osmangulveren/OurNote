import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/session";
import { D, formatTRY, round2 } from "@/lib/money";
import CartTable from "./CartTable";
import PlaceOrderButton from "./PlaceOrderButton";

export default async function CartPage() {
  const session = await requireCustomer();
  const userId = session.user!.id;

  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
  });

  let subtotal = new D(0);
  let vat = new D(0);
  for (const item of cart.items) {
    const lineSub = round2(new D(item.product.price).mul(item.quantity));
    const lineVat = round2(lineSub.mul(item.product.vatRate).div(100));
    subtotal = subtotal.add(lineSub);
    vat = vat.add(lineVat);
  }
  const grand = round2(subtotal.add(vat));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Sepetim</h1>
      {cart.items.length === 0 ? (
        <p className="text-slate-500">Sepetiniz boş.</p>
      ) : (
        <>
          <CartTable
            items={cart.items.map((i) => ({
              id: i.id,
              productId: i.productId,
              name: i.product.name,
              sku: i.product.sku,
              unit: i.product.unit,
              quantity: i.quantity,
              available: i.product.stockQuantity - i.product.reservedQuantity + i.quantity,
              unitPrice: i.product.price.toString(),
              vatRate: i.product.vatRate.toString(),
            }))}
          />
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
