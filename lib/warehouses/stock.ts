import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Bir ürünün tüm depolardaki toplam kullanılabilir stok'u (stockQuantity - reservedQuantity).
 *
 * Kaynak: WarehouseStock tablosu. Product.stockQuantity ise eski tek-depo
 * davranışını korumak için "fallback / specle" olarak güncel tutulur.
 */
export async function totalAvailable(productId: string, tx: Prisma.TransactionClient | typeof prisma = prisma): Promise<number> {
  const rows = await tx.warehouseStock.findMany({ where: { productId } });
  return rows.reduce((sum, r) => sum + Math.max(0, r.stockQuantity - r.reservedQuantity), 0);
}

/**
 * Verilen miktarı depo önceliğine göre dağıtır:
 *  - default warehouse önce
 *  - sonra kalan diğer aktif depolar (en çok kullanılabilir olan önce)
 *
 * Geri dönen plan: [{ warehouseId, quantity }]. Toplam stok yetersizse hata atar.
 */
export async function allocateAcrossWarehouses(
  tx: Prisma.TransactionClient,
  productId: string,
  quantity: number,
): Promise<Array<{ warehouseId: string; warehouseStockId: string; quantity: number }>> {
  const stocks = await tx.warehouseStock.findMany({
    where: { productId },
    include: { warehouse: true },
  });
  const sorted = stocks
    .filter((s) => s.warehouse.isActive)
    .sort((a, b) => {
      if (a.warehouse.isDefault !== b.warehouse.isDefault) return a.warehouse.isDefault ? -1 : 1;
      const availA = Math.max(0, a.stockQuantity - a.reservedQuantity);
      const availB = Math.max(0, b.stockQuantity - b.reservedQuantity);
      return availB - availA;
    });

  const plan: Array<{ warehouseId: string; warehouseStockId: string; quantity: number }> = [];
  let remaining = quantity;
  for (const s of sorted) {
    if (remaining <= 0) break;
    const avail = Math.max(0, s.stockQuantity - s.reservedQuantity);
    if (avail <= 0) continue;
    const take = Math.min(avail, remaining);
    plan.push({ warehouseId: s.warehouseId, warehouseStockId: s.id, quantity: take });
    remaining -= take;
  }
  if (remaining > 0) throw new Error(`Stok yetersiz (${quantity - remaining}/${quantity} ayrılabildi).`);
  return plan;
}

/**
 * Ürünün Product.stockQuantity ve reservedQuantity alanlarını
 * WarehouseStock toplamlarından yeniden hesaplar. Eski raporları
 * bozmamak için stok hareketlerinden sonra çağırılır.
 */
export async function syncProductStockTotals(tx: Prisma.TransactionClient, productId: string) {
  const rows = await tx.warehouseStock.findMany({ where: { productId } });
  const totalStock = rows.reduce((s, r) => s + r.stockQuantity, 0);
  const totalReserved = rows.reduce((s, r) => s + r.reservedQuantity, 0);
  await tx.product.update({
    where: { id: productId },
    data: { stockQuantity: totalStock, reservedQuantity: totalReserved },
  });
}
