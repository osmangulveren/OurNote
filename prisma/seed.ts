import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { importCatalog } from "../lib/catalog-import";
import { computeTotals, unitPrice } from "../lib/pricing";

const db = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin12345";
  await db.user.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, name: "Admin", role: "ADMIN", passwordHash: await bcrypt.hash(adminPassword, 10) },
    update: {},
  });

  const result = await importCatalog(db, JSON.parse(readFileSync("data/catalog.json", "utf8")));
  console.log(`Catalog: ${result.created} created, ${result.updated} updated`);

  // Demo buyer with one order on a truck, so tracking can be seen immediately.
  if (await db.user.findUnique({ where: { email: "buyer@example.com" } })) return;
  const company = await db.company.create({
    data: {
      name: "Casa Mobila Demo SRL", vatNumber: "DE123456789", country: "DE", city: "Munich",
      address: "Musterstraße 12", postalCode: "80331", phone: "+49 89 000000", status: "APPROVED",
    },
  });
  const buyer = await db.user.create({
    data: {
      email: "buyer@example.com", name: "Demo Buyer", role: "BUYER", companyId: company.id,
      passwordHash: await bcrypt.hash("buyer12345", 10),
    },
  });

  const products = await db.product.findMany({ where: { sku: { in: ["SB-190", "AC-095"] } } });
  const lines = products.map((p) => {
    const quantity = p.moq * 3;
    return { p, quantity, unitPrice: unitPrice(p, quantity), volumeM3: p.volumeM3 };
  });
  const totals = computeTotals({ lines, country: company.country, vatNumber: company.vatNumber });

  const truck = await db.shipment.create({
    data: {
      code: "TIR-2026-001", truckPlate: "34 ABC 123", trailerPlate: "34 TR 456", driverName: "Mehmet Y.",
      carrier: "Own fleet", route: "Istanbul → Kapıkule → Sofia → Bucharest → Budapest → Munich",
      stage: "AT_BORDER", departedAt: new Date(Date.now() - 2 * 864e5), eta: new Date(Date.now() + 4 * 864e5),
      events: {
        create: [
          { stage: "LOADING", location: "Istanbul, TR", note: "Loading started", createdAt: new Date(Date.now() - 3 * 864e5) },
          { stage: "DEPARTED", location: "Istanbul, TR", note: "Truck departed", createdAt: new Date(Date.now() - 2 * 864e5) },
          { stage: "AT_BORDER", location: "Kapıkule / Kapitan Andreevo", note: "Waiting for customs clearance", createdAt: new Date(Date.now() - 864e5) },
        ],
      },
    },
  });

  await db.order.create({
    data: {
      number: "ORD-2026-0001", companyId: company.id, userId: buyer.id, status: "CUSTOMS",
      paymentMethod: "BANK_TRANSFER", paymentStatus: "PAID", paidAt: new Date(Date.now() - 10 * 864e5),
      subtotal: totals.subtotal, freight: totals.freight, vatRate: totals.vatRate, vatAmount: totals.vatAmount,
      total: totals.total, vatNote: totals.vatNote, totalVolumeM3: totals.volume,
      deliveryName: company.name, deliveryAddress: company.address, deliveryCity: company.city,
      deliveryPostal: company.postalCode, deliveryCountry: company.country, deliveryPhone: company.phone,
      shipmentId: truck.id,
      items: {
        create: lines.map((l) => ({
          productId: l.p.id, sku: l.p.sku, name: l.p.name, unitPrice: l.unitPrice, quantity: l.quantity,
          lineTotal: Math.round(l.unitPrice * l.quantity * 100) / 100, volumeM3: l.p.volumeM3,
        })),
      },
      events: {
        create: [
          { status: "PENDING_PAYMENT", createdAt: new Date(Date.now() - 14 * 864e5) },
          { status: "CONFIRMED", note: "Bank transfer received", createdAt: new Date(Date.now() - 10 * 864e5) },
          { status: "IN_PRODUCTION", createdAt: new Date(Date.now() - 9 * 864e5) },
          { status: "LOADING", createdAt: new Date(Date.now() - 3 * 864e5) },
          { status: "IN_TRANSIT", createdAt: new Date(Date.now() - 2 * 864e5) },
          { status: "CUSTOMS", note: "Kapıkule border", createdAt: new Date(Date.now() - 864e5) },
        ],
      },
    },
  });
  console.log("Demo buyer: buyer@example.com / buyer12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
