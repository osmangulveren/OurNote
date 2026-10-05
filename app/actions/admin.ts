"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { importCatalog } from "@/lib/catalog-import";
import { db } from "@/lib/db";
import { slugify } from "@/lib/format";
import { markOrderPaid, nextShipmentCode, setOrderStatus } from "@/lib/orders";
import { ORDER_STATUSES, SHIPMENT_STAGES } from "@/lib/status";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => Number(str(f, k).replace(",", ".")) || 0;
const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

// ---------- Customers
export async function setCompanyStatus(form: FormData) {
  await requireAdmin();
  const status = str(form, "status");
  if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) return;
  await db.company.update({ where: { id: str(form, "id") }, data: { status } });
  revalidatePath("/admin", "layout");
}

// ---------- Categories
export async function saveCategory(form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  const data = { name: str(form, "name"), description: str(form, "description"), sortOrder: num(form, "sortOrder") };
  if (!data.name) return;
  if (id) await db.category.update({ where: { id }, data });
  else await db.category.create({ data: { ...data, slug: slugify(data.name) } });
  revalidatePath("/", "layout");
}

export async function deleteCategory(form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  if ((await db.product.count({ where: { categoryId: id } })) > 0) return;
  await db.category.delete({ where: { id } });
  revalidatePath("/", "layout");
}

// ---------- Products
export async function saveProduct(form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  const tiers = lines(str(form, "priceTiers"))
    .map((l) => l.split(/[:=]/).map((x) => Number(x.trim().replace(",", "."))))
    .filter(([q, p]) => q > 0 && p > 0)
    .map(([minQty, price]) => ({ minQty, price }));
  const specs = lines(str(form, "specs"))
    .map((l) => {
      const i = l.indexOf(":");
      return i > 0 ? { label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() } : null;
    })
    .filter(Boolean);
  const data = {
    sku: str(form, "sku"),
    name: str(form, "name"),
    categoryId: str(form, "categoryId"),
    shortDescription: str(form, "shortDescription"),
    description: str(form, "description"),
    images: JSON.stringify(lines(str(form, "images"))),
    price: num(form, "price"),
    priceTiers: JSON.stringify(tiers),
    moq: Math.max(1, Math.floor(num(form, "moq"))),
    unit: str(form, "unit") || "pcs",
    unitsPerCarton: Math.max(1, Math.floor(num(form, "unitsPerCarton"))),
    leadTimeDays: Math.floor(num(form, "leadTimeDays")),
    dimensions: str(form, "dimensions"),
    weightKg: num(form, "weightKg"),
    volumeM3: num(form, "volumeM3"),
    material: str(form, "material"),
    colors: JSON.stringify(str(form, "colors").split(",").map((c) => c.trim()).filter(Boolean)),
    specs: JSON.stringify(specs),
    active: form.get("active") === "on",
    featured: form.get("featured") === "on",
    supplierName: str(form, "supplierName"),
    supplierPrice: num(form, "supplierPrice"),
    sourceUrl: str(form, "sourceUrl"),
  };
  if (!data.sku || !data.name || !data.categoryId || data.price <= 0) {
    throw new Error("SKU, name, category and price are required");
  }
  if (id) {
    await db.product.update({ where: { id }, data });
  } else {
    let slug = slugify(`${data.name}-${data.sku}`);
    if (await db.product.findUnique({ where: { slug } })) slug = `${slug}-${Date.now()}`;
    await db.product.create({ data: { ...data, slug } });
  }
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function toggleProduct(form: FormData) {
  await requireAdmin();
  const p = await db.product.findUnique({ where: { id: str(form, "id") } });
  if (!p) return;
  await db.product.update({ where: { id: p.id }, data: { active: !p.active } });
  revalidatePath("/", "layout");
}

export async function importCatalogJson(_: unknown, form: FormData) {
  await requireAdmin();
  const file = form.get("file");
  const text = file instanceof File && file.size > 0 ? await file.text() : str(form, "json");
  try {
    const r = await importCatalog(db, JSON.parse(text));
    revalidatePath("/", "layout");
    return { ok: `Imported: ${r.created} new, ${r.updated} updated products.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message.slice(0, 500) : "Import failed" };
  }
}

// ---------- Orders
export async function updateOrderStatus(form: FormData) {
  await requireAdmin();
  const status = str(form, "status");
  if (!ORDER_STATUSES.includes(status)) return;
  await setOrderStatus(str(form, "id"), status, str(form, "note"));
  revalidatePath("/admin", "layout");
}

export async function adminMarkPaid(form: FormData) {
  await requireAdmin();
  await markOrderPaid(str(form, "id"), "Payment confirmed by admin");
  revalidatePath("/admin", "layout");
}

// ---------- Shipments (trucks)
export async function createShipment(form: FormData) {
  await requireAdmin();
  const s = await db.shipment.create({
    data: {
      code: await nextShipmentCode(),
      truckPlate: str(form, "truckPlate"),
      trailerPlate: str(form, "trailerPlate"),
      driverName: str(form, "driverName"),
      driverPhone: str(form, "driverPhone"),
      carrier: str(form, "carrier"),
      route: str(form, "route"),
      eta: str(form, "eta") ? new Date(str(form, "eta")) : null,
    },
  });
  redirect(`/admin/shipments/${s.id}`);
}

export async function updateShipment(form: FormData) {
  await requireAdmin();
  await db.shipment.update({
    where: { id: str(form, "id") },
    data: {
      truckPlate: str(form, "truckPlate"),
      trailerPlate: str(form, "trailerPlate"),
      driverName: str(form, "driverName"),
      driverPhone: str(form, "driverPhone"),
      carrier: str(form, "carrier"),
      route: str(form, "route"),
      eta: str(form, "eta") ? new Date(str(form, "eta")) : null,
    },
  });
  revalidatePath("/admin", "layout");
}

export async function assignOrderToShipment(form: FormData) {
  await requireAdmin();
  const shipmentId = str(form, "shipmentId");
  const orderId = str(form, "orderId");
  const shipment = await db.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment) return;
  await db.order.update({ where: { id: orderId }, data: { shipmentId } });
  const stage = SHIPMENT_STAGES.find((s) => s.key === shipment.stage);
  if (stage?.orderStatus) await setOrderStatus(orderId, stage.orderStatus, `Truck ${shipment.truckPlate}`);
  revalidatePath("/admin", "layout");
}

export async function removeOrderFromShipment(form: FormData) {
  await requireAdmin();
  await db.order.update({ where: { id: str(form, "orderId") }, data: { shipmentId: null } });
  revalidatePath("/admin", "layout");
}

/** Records a tracking update for the truck and moves every order on board to the matching status. */
export async function addShipmentEvent(form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  const stage = SHIPMENT_STAGES.find((s) => s.key === str(form, "stage"));
  if (!stage) return;
  const location = str(form, "location");
  const note = str(form, "note");
  const shipment = await db.shipment.update({
    where: { id },
    data: {
      stage: stage.key,
      ...(stage.key === "DEPARTED" ? { departedAt: new Date() } : {}),
      ...(str(form, "eta") ? { eta: new Date(str(form, "eta")) } : {}),
      events: { create: { stage: stage.key, location, note } },
    },
    include: { orders: true },
  });
  if (stage.orderStatus) {
    for (const o of shipment.orders) {
      if (o.status === "DELIVERED" || o.status === "CANCELLED") continue;
      await setOrderStatus(o.id, stage.orderStatus, [location, note].filter(Boolean).join(" — "));
    }
  }
  revalidatePath("/admin", "layout");
}

export async function markOrderDelivered(form: FormData) {
  await requireAdmin();
  await setOrderStatus(str(form, "orderId"), "DELIVERED", str(form, "note") || "Delivered to store");
  revalidatePath("/admin", "layout");
}
