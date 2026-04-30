import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("→ Seeding database…");

  const adminPass = await bcrypt.hash("admin123", 10);
  const customerPass = await bcrypt.hash("customer123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Sistem Yöneticisi",
      passwordHash: adminPass,
      role: Role.ADMIN,
    },
  });

  const customer1 = await prisma.user.upsert({
    where: { email: "musteri1@example.com" },
    update: {},
    create: {
      email: "musteri1@example.com",
      name: "Ahmet Yılmaz",
      passwordHash: customerPass,
      role: Role.CUSTOMER,
      customerProfile: {
        create: {
          companyName: "Yılmaz Ticaret Ltd. Şti.",
          taxNumber: "1112223334",
          phone: "+90 532 000 00 01",
          address: "İstanbul",
        },
      },
      cart: { create: {} },
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: "musteri2@example.com" },
    update: {},
    create: {
      email: "musteri2@example.com",
      name: "Ayşe Kaya",
      passwordHash: customerPass,
      role: Role.CUSTOMER,
      customerProfile: {
        create: {
          companyName: "Kaya Endüstri A.Ş.",
          taxNumber: "5556667778",
          phone: "+90 532 000 00 02",
          address: "İzmir",
        },
      },
      cart: { create: {} },
    },
  });

  const products = [
    {
      sku: "VIDA-M6-25",
      name: "Vida M6x25 Galvanizli",
      description: "Galvanizli paslanmaz vida, paket içi 100 adet.",
      unit: "paket",
      price: "45.00",
      vatRate: "20.00",
      stockQuantity: 500,
    },
    {
      sku: "SOMUN-M6",
      name: "Somun M6 Çelik",
      description: "Çelik altıgen somun, paket içi 200 adet.",
      unit: "paket",
      price: "30.00",
      vatRate: "20.00",
      stockQuantity: 350,
    },
    {
      sku: "PUL-M6",
      name: "Pul M6 Galvaniz",
      description: "Düz pul, paket içi 500 adet.",
      unit: "paket",
      price: "20.00",
      vatRate: "20.00",
      stockQuantity: 600,
    },
    {
      sku: "KABLO-2.5",
      name: "NYA Kablo 2.5mm² (100m)",
      description: "Tek damarlı bakır kablo, 100 metre rulo.",
      unit: "rulo",
      price: "850.00",
      vatRate: "20.00",
      stockQuantity: 75,
    },
    {
      sku: "PRIZ-TOP",
      name: "Topraklı Priz",
      description: "16A topraklı sıva üstü priz.",
      unit: "adet",
      price: "55.00",
      vatRate: "20.00",
      stockQuantity: 240,
    },
    {
      sku: "AMP-LED-9W",
      name: "LED Ampul 9W E27",
      description: "9W E27 duylu LED ampul, 6500K.",
      unit: "adet",
      price: "32.00",
      vatRate: "10.00",
      stockQuantity: 180,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }

  console.log("✓ Admin:", admin.email, "(password: admin123)");
  console.log("✓ Customer 1:", customer1.email, "(password: customer123)");
  console.log("✓ Customer 2:", customer2.email, "(password: customer123)");
  console.log(`✓ Products: ${products.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
