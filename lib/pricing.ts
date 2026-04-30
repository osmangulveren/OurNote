import { Prisma } from "@prisma/client";
import { D, round2 } from "@/lib/money";

export interface CustomerPricingContext {
  discountPercentage?: Prisma.Decimal | string | number | null;
  productOverrides?: Record<string, Prisma.Decimal | string | number>; // productId → price
}

/**
 * Bir müşteri için bir ürünün geçerli birim fiyatını döndürür.
 * Öncelik: ürün-bazlı override > müşteri profili discount > liste fiyatı.
 */
export function effectiveUnitPrice(
  basePrice: Prisma.Decimal | string | number,
  productId: string,
  ctx: CustomerPricingContext | null | undefined,
): Prisma.Decimal {
  const base = new D(basePrice);
  if (!ctx) return base;

  const override = ctx.productOverrides?.[productId];
  if (override !== undefined && override !== null) {
    return new D(override);
  }

  const pct = ctx.discountPercentage ? new D(ctx.discountPercentage) : new D(0);
  if (pct.lte(0)) return base;
  if (pct.gte(100)) return new D(0);

  return round2(base.mul(new D(100).sub(pct)).div(100));
}

/**
 * Müşterinin tüm ürün override'larını id-eşlemeli hash olarak getirir.
 */
export async function loadCustomerPricingContext(
  prisma: { customerProductPrice: { findMany: (args: any) => Promise<any[]> }; customerProfile: { findUnique: (args: any) => Promise<any> } },
  userId: string,
): Promise<CustomerPricingContext> {
  const [profile, overrides] = await Promise.all([
    prisma.customerProfile.findUnique({ where: { userId } }),
    prisma.customerProductPrice.findMany({ where: { customerId: userId } }),
  ]);
  const productOverrides: Record<string, Prisma.Decimal> = {};
  for (const o of overrides) productOverrides[o.productId] = o.price;
  return {
    discountPercentage: profile?.discountPercentage ?? new D(0),
    productOverrides,
  };
}
