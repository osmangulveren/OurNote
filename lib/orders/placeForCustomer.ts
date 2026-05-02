import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { D, round2 } from "@/lib/money";
import { effectiveUnitPrice, loadCustomerPricingContext } from "@/lib/pricing";
import { allocateAcrossWarehouses, syncProductStockTotals } from "@/lib/warehouses/stock";

function generateOrderNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${stamp}-${rand}`;
}

/**
 * AI / sistem-içi entegrasyonlardan çağrılan sipariş oluşturma akışı.
 *
 * `lib/orders/actions.ts:placeOrder` ile aynı mantığı uygular;
 * fark: oturum yerine doğrudan `customerId` alır ve redirect etmez,
 * sonucu obje olarak döndürür. Server action akışı bu fonksiyonu
 * yeniden kullanmak için ileride refactor edilebilir.
 */
export async function placeOrderForCustomer(customerId: string): Promise<
  { ok: true; data: { orderId: string; orderNumber: string; grandTotal: string } } | { ok: false; error: string }
> {
  const cart = await prisma.cart.findUnique({
    where: { userId: customerId },
    include: { items: { include: { product: true } } },
  });
  if (!cart || cart.items.length === 0) return { ok: false, error: "Sepetiniz boş." };

  const pricingCtx = await loadCustomerPricingContext(prisma, customerId);

  try {
    const order = await prisma.$transaction(async (tx) => {
      let subtotal = new D(0);
      let vatTotal = new D(0);
      const items: Prisma.OrderItemCreateManyOrderInput[] = [];

      for (const item of cart.items) {
        const fresh = await tx.product.findUnique({ where: { id: item.productId } });
        if (!fresh || !fresh.isActive) throw new Error(`${item.product.name} satışta değil.`);

        const config = (item.configuration as any) ?? null;
        const compMultiplier = Number(config?.composition?.priceMultiplier ?? 1);
        const addonsDelta = Array.isArray(config?.addons)
          ? config.addons.reduce((s: number, a: any) => s + Number(a?.priceDelta ?? 0), 0)
          : 0;

        const baseUnit = effectiveUnitPrice(fresh.price as any, fresh.id, pricingCtx);
        const unitPrice = round2(baseUnit.mul(compMultiplier).add(new D(addonsDelta)));
        const vatRate = new D(fresh.vatRate);
        const lineSubtotal = round2(unitPrice.mul(item.quantity));
        const lineVat = round2(lineSubtotal.mul(vatRate).div(100));
        const lineTotal = round2(lineSubtotal.add(lineVat));
        subtotal = subtotal.add(lineSubtotal);
        vatTotal = vatTotal.add(lineVat);

        const allocation = await allocateAcrossWarehouses(tx, fresh.id, item.quantity);

        items.push({
          productId: fresh.id,
          productName: fresh.name,
          sku: fresh.sku,
          unit: fresh.unit,
          unitPrice,
          vatRate,
          quantity: item.quantity,
          lineSubtotal,
          lineVat,
          lineTotal,
          configuration: config ?? Prisma.JsonNull,
          warehouseAllocation: allocation as any,
        });

        for (const a of allocation) {
          await tx.warehouseStock.update({
            where: { id: a.warehouseStockId },
            data: { reservedQuantity: { increment: a.quantity } },
          });
        }
        await syncProductStockTotals(tx, fresh.id);
      }

      const grandTotal = round2(subtotal.add(vatTotal));
      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: customerId,
          status: OrderStatus.PENDING,
          subtotal: round2(subtotal),
          vatTotal: round2(vatTotal),
          grandTotal,
          items: { createMany: { data: items } },
        },
      });

      for (const item of cart.items) {
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "RESERVE",
            quantity: item.quantity,
            orderId: created.id,
            note: `Sipariş ${created.orderNumber} için rezervasyon (AI asistan)`,
          },
        });
      }
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });

    return { ok: true, data: { orderId: order.id, orderNumber: order.orderNumber, grandTotal: order.grandTotal.toString() } };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Sipariş oluşturulamadı." };
  }
}
