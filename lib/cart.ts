import "server-only";
import { db } from "./db";
import { fabricOf } from "./fabrics";
import type { PlanItem } from "./loadplan";
import { computeTotals, unitPrice } from "./pricing";
import { packedBox, shapeOf } from "./shape";

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
  const maxLead = items.length ? Math.max(...items.map((i) => i.product.leadTimeDays)) : 0;
  return { lines, totals, maxLead };
}

/** Packages for the 3D load planner. */
export function planItems(lines: Awaited<ReturnType<typeof getCart>>["lines"]): PlanItem[] {
  return lines.map(({ item }) => {
    const b = packedBox(shapeOf(item.product), item.product.volumeM3);
    return {
      key: item.id,
      color: fabricOf(item.color || "Sand Velvet").hex,
      w: b.w / 100, d: b.d / 100, h: b.h / 100,
      qty: item.quantity,
      mine: true,
    };
  });
}
