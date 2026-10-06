import { readFileSync } from "node:fs";
import { PrismaClient, type Product } from "@prisma/client";
import bcrypt from "bcryptjs";
import { importCatalog } from "../lib/catalog-import";
import { computeTotals, unitPrice } from "../lib/pricing";

const db = new PrismaClient();
const day = 864e5;
const at = (days: number) => new Date(Date.now() + days * day);

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

  if (await db.user.findUnique({ where: { email: "buyer@example.com" } })) return;
  const products = await db.product.findMany();
  const bySku = (sku: string) => products.find((p) => p.sku === sku)!;

  // ---- Trucks: one on the road, two open for booking (groupage)
  const onRoad = await db.shipment.create({
    data: {
      code: "TIR-2026-001", truckPlate: "34 ABC 123", trailerPlate: "34 TR 456", driverName: "Mehmet Y.",
      driverPhone: "+90 532 000 00 00", carrier: "Own fleet", route: "Istanbul → Kapıkule → Sofia → Budapest → Munich",
      stage: "AT_BORDER", departedAt: at(-2), plannedDepartureAt: at(-2), eta: at(4), capacityM3: 82,
      events: {
        create: [
          { stage: "LOADING", location: "Inegöl workshop, TR", note: "Loading started", createdAt: at(-3) },
          { stage: "DEPARTED", location: "Istanbul, TR", note: "Truck departed", createdAt: at(-2) },
          { stage: "AT_BORDER", location: "Kapıkule / Kapitan Andreevo", note: "Export declaration accepted, waiting for EU entry", createdAt: at(-1) },
        ],
      },
    },
  });
  const west = await db.shipment.create({
    data: {
      code: "TIR-2026-002", truckPlate: "16 KLM 482", carrier: "Own fleet", bookable: true,
      route: "Istanbul → Kapıkule → Sofia → Budapest → Vienna → Munich → Frankfurt → Rotterdam",
      cutoffAt: at(4), plannedDepartureAt: at(26), eta: at(31), capacityM3: 82,
    },
  });
  await db.shipment.create({
    data: {
      code: "TIR-2026-003", truckPlate: "16 PRS 117", carrier: "Partner carrier", bookable: true,
      route: "Istanbul → Kapıkule → Bucharest → Budapest → Vienna → Milan",
      cutoffAt: at(15), plannedDepartureAt: at(40), eta: at(45), capacityM3: 82,
    },
  });

  // ---- Demo stores
  const mkCompany = (name: string, vat: string, country: string, city: string, address: string, postal: string) =>
    db.company.create({ data: { name, vatNumber: vat, country, city, address, postalCode: postal, phone: "+49 89 000000", status: "APPROVED" } });

  const casa = await mkCompany("Casa Mobila Demo SRL", "DE123456789", "DE", "Munich", "Musterstraße 12", "80331");
  const buyer = await db.user.create({
    data: { email: "buyer@example.com", name: "Demo Buyer", role: "BUYER", companyId: casa.id, passwordHash: await bcrypt.hash("buyer12345", 10) },
  });
  const others = [
    await mkCompany("Wonen & Zo BV", "NL123456789B01", "NL", "Utrecht", "Oudegracht 50", "3511"),
    await mkCompany("Möbel Atelier GmbH", "ATU12345678", "AT", "Graz", "Herrengasse 3", "8010"),
  ];
  const otherUsers = await Promise.all(
    others.map((c, i) =>
      db.user.create({ data: { email: `store${i + 1}@example.com`, name: c.name, companyId: c.id, passwordHash: "!", role: "BUYER" } }),
    ),
  );

  let n = 0;
  async function order(opts: {
    company: typeof casa; userId: string; lines: [Product, number][]; shipmentId?: string; status: string;
    paymentStatus: string; plan: "FULL" | "DEPOSIT"; history: [string, number, string?][];
  }) {
    const lines = opts.lines.map(([p, quantity]) => ({ p, quantity, unitPrice: unitPrice(p, quantity), volumeM3: p.volumeM3 }));
    const t = computeTotals({ lines, country: opts.company.country, vatNumber: opts.company.vatNumber });
    const deposit = Math.round(t.total * 0.3 * 100) / 100;
    n++;
    return db.order.create({
      data: {
        number: `ORD-2026-${String(n).padStart(4, "0")}`, companyId: opts.company.id, userId: opts.userId,
        status: opts.status, paymentMethod: "BANK_TRANSFER", paymentStatus: opts.paymentStatus, paymentPlan: opts.plan,
        depositAmount: opts.plan === "DEPOSIT" ? deposit : 0,
        paidAmount: opts.paymentStatus === "PAID" ? t.total : opts.paymentStatus === "DEPOSIT_PAID" ? deposit : 0,
        paidAt: opts.paymentStatus === "UNPAID" ? null : at(opts.history[1]?.[1] ?? -1),
        subtotal: t.subtotal, freight: t.freight, vatRate: t.vatRate, vatAmount: t.vatAmount, total: t.total,
        vatNote: t.vatNote, totalVolumeM3: t.volume,
        deliveryName: opts.company.name, deliveryAddress: opts.company.address, deliveryCity: opts.company.city,
        deliveryPostal: opts.company.postalCode, deliveryCountry: opts.company.country, deliveryPhone: opts.company.phone,
        shipmentId: opts.shipmentId,
        createdAt: at(opts.history[0][1]),
        items: {
          create: lines.map((l) => ({
            productId: l.p.id, sku: l.p.sku, name: l.p.name, color: "", unitPrice: l.unitPrice, quantity: l.quantity,
            lineTotal: Math.round(l.unitPrice * l.quantity * 100) / 100, volumeM3: l.p.volumeM3,
          })),
        },
        events: { create: opts.history.map(([status, d, note]) => ({ status, note: note ?? "", createdAt: at(d) })) },
      },
    });
  }

  // On the road to Munich
  await order({
    company: casa, userId: buyer.id, shipmentId: onRoad.id, status: "CUSTOMS", paymentStatus: "PAID", plan: "DEPOSIT",
    lines: [[bySku("SB-190"), 12], [bySku("AC-095"), 18], [bySku("OT-045"), 40]],
    history: [["PENDING_PAYMENT", -24], ["CONFIRMED", -22, "30% deposit received"], ["IN_PRODUCTION", -21], ["LOADING", -3, "Balance received"], ["IN_TRANSIT", -2], ["CUSTOMS", -1, "Kapıkule border"]],
  });
  // Booked on the next western truck, deposit paid, in production
  await order({
    company: casa, userId: buyer.id, shipmentId: west.id, status: "IN_PRODUCTION", paymentStatus: "DEPOSIT_PAID", plan: "DEPOSIT",
    lines: [[bySku("CS-300C"), 2], [bySku("AC-080"), 6]],
    history: [["PENDING_PAYMENT", -6], ["CONFIRMED", -5, "30% deposit received"], ["IN_PRODUCTION", -4]],
  });
  // Other stores sharing the same truck
  await order({
    company: others[0], userId: otherUsers[0].id, shipmentId: west.id, status: "IN_PRODUCTION", paymentStatus: "PAID", plan: "FULL",
    lines: [[bySku("CS-280L"), 4], [bySku("SB-160"), 6]],
    history: [["PENDING_PAYMENT", -8], ["CONFIRMED", -8], ["IN_PRODUCTION", -7]],
  });
  await order({
    company: others[1], userId: otherUsers[1].id, shipmentId: west.id, status: "CONFIRMED", paymentStatus: "DEPOSIT_PAID", plan: "DEPOSIT",
    lines: [[bySku("BD-160"), 6], [bySku("SS-331"), 2]],
    history: [["PENDING_PAYMENT", -3], ["CONFIRMED", -2]],
  });
  console.log("Demo buyer: buyer@example.com / buyer12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
