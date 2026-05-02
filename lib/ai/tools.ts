import { prisma } from "@/lib/prisma";
import { D, formatTRY } from "@/lib/money";
import { effectiveUnitPrice, loadCustomerPricingContext } from "@/lib/pricing";
import { PRODUCTION_STAGE_LABEL } from "@/lib/orders/productionStages";
import type { ToolDefinition, ToolName } from "./types";

const CATEGORY_LABEL: Record<string, string> = {
  KOLTUK: "Tekli Koltuk", KANEPE: "Kanepe / Set", SOMINE: "Şömine",
};

export const TOOL_DEFS: ToolDefinition[] = [
  {
    name: "search_products",
    description: "Ürün kataloğunda arama yapar. Kumaş, renk, kategori, fiyat aralığı gibi serbest metin sorgusunu kabul eder.",
    parameters: {
      query: { type: "string", description: "Aranan kelime, kategori adı, kumaş türü, vb." },
    },
  },
  {
    name: "get_product_details",
    description: "Bir ürünün tüm teknik özelliklerini ve fiyatını döner.",
    parameters: {
      productId: { type: "string", description: "Ürün ID veya SKU", required: true },
    },
  },
  {
    name: "view_cart",
    description: "Müşterinin sepetindeki ürünleri ve toplamı listeler.",
    parameters: {},
  },
  {
    name: "add_to_cart",
    description: "Bir ürünü müşterinin sepetine ekler. Kullanıcının onayını aldıktan sonra çağırın.",
    parameters: {
      productId: { type: "string", description: "Ürün ID veya SKU", required: true },
      quantity: { type: "number", description: "Adet (en az 1)", required: true },
    },
  },
  {
    name: "remove_from_cart",
    description: "Sepetten bir ürünü çıkarır.",
    parameters: {
      productId: { type: "string", description: "Ürün ID veya SKU", required: true },
    },
  },
  {
    name: "place_order",
    description: "Sepetteki ürünleri sipariş olarak oluşturur. Kullanıcının açık onayını aldıktan sonra çağırın.",
    parameters: {},
  },
  {
    name: "list_my_orders",
    description: "Müşterinin siparişlerini durumlarıyla listeler.",
    parameters: {},
  },
  {
    name: "get_order_status",
    description: "Belirli bir siparişin güncel durumunu ve üretim aşamasını verir.",
    parameters: {
      orderNumber: { type: "string", description: "Sipariş numarası", required: true },
    },
  },
];

export interface ToolContext {
  customerId: string;
}

/**
 * Tüm tool çağrıları buradan geçer. ID veya SKU eşleşmesini destekler;
 * yan etkili işlemler (add_to_cart, place_order) müşterinin gerçek
 * sepeti üstünde çalışır ve mevcut server action mantığını yeniden kullanır.
 */
export async function executeTool(
  ctx: ToolContext,
  name: ToolName,
  args: Record<string, unknown>,
): Promise<{ ok: true; data: any } | { ok: false; error: string }> {
  try {
    switch (name) {
      case "search_products": return await searchProducts(ctx, String(args.query ?? ""));
      case "get_product_details": return await getProductDetails(ctx, String(args.productId ?? ""));
      case "view_cart": return await viewCart(ctx);
      case "add_to_cart": return await addToCart(ctx, String(args.productId ?? ""), Number(args.quantity ?? 0));
      case "remove_from_cart": return await removeFromCart(ctx, String(args.productId ?? ""));
      case "place_order": return await placeOrder(ctx);
      case "list_my_orders": return await listMyOrders(ctx);
      case "get_order_status": return await getOrderStatus(ctx, String(args.orderNumber ?? ""));
      default: return { ok: false, error: `Bilinmeyen araç: ${name}` };
    }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Bilinmeyen hata" };
  }
}

async function resolveProductId(ref: string) {
  const r = ref.trim();
  if (!r) return null;
  let p = await prisma.product.findUnique({ where: { id: r } });
  if (!p) p = await prisma.product.findUnique({ where: { sku: r } });
  return p;
}

async function searchProducts(ctx: ToolContext, query: string) {
  const q = query.trim().toLowerCase();
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  const ctxPrice = await loadCustomerPricingContext(prisma, ctx.customerId);
  const filtered = q
    ? products.filter((p) =>
        [p.name, p.sku, p.collection, p.designer, p.modelInfo, p.fabricColor, p.fabricType, p.frameType, p.category, p.description]
          .filter(Boolean)
          .map((s) => String(s).toLowerCase())
          .some((s) => s.includes(q)),
      )
    : products;

  const results = filtered.slice(0, 10).map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: CATEGORY_LABEL[p.category] ?? p.category,
    price: effectiveUnitPrice(p.price as any, p.id, ctxPrice).toFixed(2),
    listPrice: new D(p.price as any).toFixed(2),
    available: Math.max(0, p.stockQuantity - p.reservedQuantity),
    fabric: p.fabricColor ? `${p.fabricType ?? ""} ${p.fabricColor}`.trim() : p.fabricType ?? null,
  }));
  return { ok: true as const, data: { count: results.length, results } };
}

async function getProductDetails(ctx: ToolContext, ref: string) {
  const p = await resolveProductId(ref);
  if (!p) return { ok: false as const, error: "Ürün bulunamadı." };
  const ctxPrice = await loadCustomerPricingContext(prisma, ctx.customerId);
  return {
    ok: true as const,
    data: {
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: CATEGORY_LABEL[p.category] ?? p.category,
      collection: p.collection,
      modelInfo: p.modelInfo,
      designer: p.designer,
      dimensions: { width: p.widthCm, depth: p.depthCm, height: p.heightCm },
      seat: { width: p.seatWidthCm, depth: p.seatDepthCm, height: p.seatHeightCm, count: p.seatCount },
      weightKg: p.weightKg?.toString(),
      fabric: { type: p.fabricType, color: p.fabricColor, hex: p.fabricColorHex },
      frame: p.frameType,
      foamDensityKgM3: p.foamDensityKgM3,
      durabilityMartindale: p.durabilityMartindale,
      warrantyMonths: p.warrantyMonths,
      leadTimeDays: p.leadTimeDays,
      careInstructions: p.careInstructions,
      price: effectiveUnitPrice(p.price as any, p.id, ctxPrice).toFixed(2),
      listPrice: new D(p.price as any).toFixed(2),
      available: Math.max(0, p.stockQuantity - p.reservedQuantity),
      description: p.description,
    },
  };
}

async function viewCart(ctx: ToolContext) {
  const cart = await prisma.cart.findUnique({
    where: { userId: ctx.customerId },
    include: { items: { include: { product: true } } },
  });
  if (!cart || cart.items.length === 0) return { ok: true as const, data: { items: [], total: "0.00", count: 0 } };
  const ctxPrice = await loadCustomerPricingContext(prisma, ctx.customerId);
  let total = new D(0);
  const items = cart.items.map((i) => {
    const unit = effectiveUnitPrice(i.product.price as any, i.productId, ctxPrice);
    const line = unit.mul(i.quantity);
    total = total.add(line);
    return { sku: i.product.sku, name: i.product.name, quantity: i.quantity, unitPrice: unit.toFixed(2), lineTotal: line.toFixed(2) };
  });
  return { ok: true as const, data: { items, total: total.toFixed(2), totalFormatted: formatTRY(total), count: items.length } };
}

async function addToCart(ctx: ToolContext, ref: string, quantity: number) {
  if (!quantity || quantity < 1) return { ok: false as const, error: "Miktar en az 1 olmalı." };
  const product = await resolveProductId(ref);
  if (!product || !product.isActive) return { ok: false as const, error: "Ürün bulunamadı." };
  const cart = await prisma.cart.upsert({
    where: { userId: ctx.customerId },
    update: {},
    create: { userId: ctx.customerId },
  });
  // AI add — konfigürasyonsuz; varsayılan olarak konfigürasyonsuz mevcut satıra ekler
  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId: product.id, configuration: { equals: null } as any },
  });
  const newQty = (existing?.quantity ?? 0) + quantity;
  const available = product.stockQuantity - product.reservedQuantity;
  if (newQty > available) return { ok: false as const, error: `Stok yetersiz. Kullanılabilir: ${available}` };
  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId: product.id, quantity } });
  }
  return { ok: true as const, data: { added: { sku: product.sku, name: product.name, quantity }, newQuantity: newQty } };
}

async function removeFromCart(ctx: ToolContext, ref: string) {
  const product = await resolveProductId(ref);
  if (!product) return { ok: false as const, error: "Ürün bulunamadı." };
  const cart = await prisma.cart.findUnique({ where: { userId: ctx.customerId } });
  if (!cart) return { ok: true as const, data: { removed: false } };
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId: product.id } });
  return { ok: true as const, data: { removed: true, sku: product.sku } };
}

async function placeOrder(ctx: ToolContext) {
  const { placeOrderForCustomer } = await import("@/lib/orders/placeForCustomer");
  return placeOrderForCustomer(ctx.customerId);
}

async function listMyOrders(ctx: ToolContext) {
  const orders = await prisma.order.findMany({
    where: { userId: ctx.customerId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return {
    ok: true as const,
    data: orders.map((o) => ({
      orderNumber: o.orderNumber,
      status: o.status,
      stage: PRODUCTION_STAGE_LABEL[o.productionStage],
      total: o.grandTotal.toString(),
      createdAt: o.createdAt.toISOString(),
    })),
  };
}

async function getOrderStatus(ctx: ToolContext, orderNumber: string) {
  const order = await prisma.order.findFirst({
    where: { userId: ctx.customerId, orderNumber },
    include: { shipment: true },
  });
  if (!order) return { ok: false as const, error: "Sipariş bulunamadı." };
  return {
    ok: true as const,
    data: {
      orderNumber: order.orderNumber,
      status: order.status,
      stage: PRODUCTION_STAGE_LABEL[order.productionStage],
      total: order.grandTotal.toString(),
      shipment: order.shipment
        ? {
            truckPlate: order.shipment.truckPlate,
            driverName: order.shipment.driverName,
            etaAt: order.shipment.etaAt?.toISOString() ?? null,
            departedAt: order.shipment.departureAt?.toISOString() ?? null,
            deliveredAt: order.shipment.deliveredAt?.toISOString() ?? null,
            lastLocation: order.shipment.lastLat != null && order.shipment.lastLng != null
              ? { lat: order.shipment.lastLat, lng: order.shipment.lastLng, at: order.shipment.lastPingAt?.toISOString() ?? null }
              : null,
          }
        : null,
    },
  };
}
