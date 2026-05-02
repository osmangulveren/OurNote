import { prisma } from "@/lib/prisma";
import { D, formatTRY } from "@/lib/money";
import { effectiveUnitPrice, loadCustomerPricingContext } from "@/lib/pricing";
import type { KnowledgeSnapshot } from "./types";

const CATEGORY_LABEL: Record<string, string> = {
  KOLTUK: "Tekli Koltuk", KANEPE: "Kanepe / Set", SOMINE: "Şömine",
};

/**
 * Knowledge base interface — InMemoryKB tüm aktif ürünlerin yapılandırılmış
 * bir özetini sistem promptuna gömer. ~10 ürün için bu fazlasıyla yeterli.
 *
 * İleride katalog büyürse PgVectorKB implementasyonu yazılır:
 *   - pgvector extension Postgres'e kurulur
 *   - Voyage AI veya OpenAI embedding ile ürün/PDF chunk'ları embedlenir
 *   - searchByEmbedding(query) → top-K relevant chunk
 * Aynı interface, aynı orchestrator çağırır.
 */
export interface KnowledgeBase {
  buildSnapshot(customerId: string): Promise<KnowledgeSnapshot>;
}

class InMemoryKB implements KnowledgeBase {
  async buildSnapshot(customerId: string): Promise<KnowledgeSnapshot> {
    const [customer, products] = await Promise.all([
      prisma.user.findUnique({ where: { id: customerId }, include: { customerProfile: true } }),
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      }),
    ]);
    const ctx = await loadCustomerPricingContext(prisma, customerId);

    const lines = products.map((p) => {
      const eff = effectiveUnitPrice(p.price as any, p.id, ctx);
      const list = new D(p.price as any);
      const dim = [p.widthCm, p.depthCm, p.heightCm].filter(Boolean).join("×");
      const fields: string[] = [
        `[${p.sku}] ${p.name}`,
        `Kategori: ${CATEGORY_LABEL[p.category] ?? p.category}`,
        p.collection ? `Koleksiyon: ${p.collection}` : null,
        dim ? `Boyut: ${dim} cm` : null,
        p.seatCount ? `${p.seatCount} kişilik` : null,
        p.fabricType ? `Kumaş: ${p.fabricType}${p.fabricColor ? ` ${p.fabricColor}` : ""}` : null,
        p.frameType ? `İskelet: ${p.frameType}` : null,
        p.durabilityMartindale ? `Dayanıklılık: ${p.durabilityMartindale} Martindale` : null,
        p.warrantyMonths ? `Garanti: ${p.warrantyMonths} ay` : null,
        p.leadTimeDays ? `Üretim süresi: ${p.leadTimeDays} gün` : null,
        `Liste fiyatı: ${formatTRY(list)}`,
        eff.lt(list) ? `Sana özel: ${formatTRY(eff)}` : null,
        `Stok: ${Math.max(0, p.stockQuantity - p.reservedQuantity)} ${p.unit}`,
        p.description ? `Açıklama: ${p.description}` : null,
        `productId: ${p.id}`,
      ].filter(Boolean) as string[];
      return fields.join(" · ");
    });

    return {
      productSummary: lines.join("\n\n"),
      customerName: customer?.name ?? "müşteri",
      companyName: customer?.customerProfile?.companyName ?? null,
      discountPercentage: customer?.customerProfile?.discountPercentage
        ? Number(customer.customerProfile.discountPercentage)
        : 0,
    };
  }
}

let cached: KnowledgeBase | null = null;
export function getKnowledgeBase(): KnowledgeBase {
  if (!cached) cached = new InMemoryKB();
  return cached;
}
