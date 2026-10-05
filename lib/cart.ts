import "server-only";
import { db } from "./db";
import { computeTotals, unitPrice } from "./pricing";

export async function getCart(user: { id: string; company: { country: string; vatNumber: string | null } }) {
  const items = await db.cartItem.findMany({
    where: { userId: user.id },
    include: { product: { include: { category: true } } },
    orderBy: { id: "asc" },
  });
  const lines = items.map((i) => {
    const price = unitPrice(i.product, i.quantity);
    return { item: i, unitPrice: price, quantity: i.quantity, volumeM3: i.product.volumeM3, lineTotal: price * i.quantity };
  });
  const totals = computeTotals({ lines, country: user.company.country, vatNumber: user.company.vatNumber });
  return { lines, totals };
}
