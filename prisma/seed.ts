import { PrismaClient, Role, ProductCategory, FabricType, FrameType, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface SeedImage { url: string; alt?: string; isCover?: boolean }
interface SeedProduct {
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  unit?: string;
  price: string;
  vatRate?: string;
  stockQuantity: number;
  collection?: string;
  designer?: string;
  modelInfo?: string;
  widthCm?: number;
  depthCm?: number;
  heightCm?: number;
  seatWidthCm?: number;
  seatDepthCm?: number;
  seatHeightCm?: number;
  seatCount?: number;
  weightKg?: string;
  fabricType?: FabricType;
  fabricColor?: string;
  fabricColorHex?: string;
  frameType?: FrameType;
  foamDensityKgM3?: number;
  durabilityMartindale?: number;
  warrantyMonths?: number;
  leadTimeDays?: number;
  careInstructions?: string;
  images: SeedImage[];
}

const PRODUCTS: SeedProduct[] = [
  {
    sku: "BOUCLE-NORMAL-3",
    name: "Bouclé Normal Üçlü Kanepe",
    description: "Yumuşak bouclé kumaşı ve modern hatlarıyla salonların yıldızı.",
    category: ProductCategory.KANEPE,
    price: "32500.00",
    stockQuantity: 12,
    collection: "Bouclé Serisi",
    designer: "Rosadore Atelier",
    modelInfo: "Modern Soft Lines",
    widthCm: 220, depthCm: 95, heightCm: 85,
    seatWidthCm: 180, seatDepthCm: 60, seatHeightCm: 45,
    seatCount: 3,
    weightKg: "62.50",
    fabricType: FabricType.BOUCLE,
    fabricColor: "Krem",
    fabricColorHex: "#F5EDE0",
    frameType: FrameType.KAYIN_MASIF,
    foamDensityKgM3: 35,
    durabilityMartindale: 30000,
    warrantyMonths: 24,
    leadTimeDays: 21,
    careInstructions: "Kuru fırça veya nemli mikrofiber bezle silin. Direkt güneş ışığından koruyun.",
    images: [
      { url: "/products/seed/boucle-normal.png", alt: "Bouclé Normal genel görünüm", isCover: true },
      { url: "/products/seed/boucle-normal-arm.png", alt: "Kolçak detayı" },
      { url: "/products/seed/boucle-normal-back.png", alt: "Arka detay" },
      { url: "/products/seed/boucle-normal-textile.png", alt: "Kumaş detayı" },
    ],
  },
  {
    sku: "BOUCLE-DUO-SET",
    name: "Bouclé Duo Set (3+2)",
    description: "Üçlü ve ikili kanepenin uyumlu seti — geniş salonlar için ideal.",
    category: ProductCategory.KANEPE,
    price: "54000.00",
    stockQuantity: 6,
    collection: "Bouclé Serisi",
    designer: "Rosadore Atelier",
    modelInfo: "Set 3+2 Kombinasyon",
    widthCm: 220, depthCm: 95, heightCm: 85,
    seatCount: 5,
    weightKg: "112.00",
    fabricType: FabricType.BOUCLE,
    fabricColor: "Krem",
    fabricColorHex: "#F5EDE0",
    frameType: FrameType.KAYIN_MASIF,
    foamDensityKgM3: 35,
    durabilityMartindale: 30000,
    warrantyMonths: 24,
    leadTimeDays: 25,
    careInstructions: "Kuru fırça veya nemli mikrofiber bezle silin.",
    images: [
      { url: "/products/seed/boucle-duo-set.jpeg", alt: "Bouclé Duo Set", isCover: true },
    ],
  },
  {
    sku: "BOUCLE-ONE",
    name: "Bouclé One Tekli Koltuk",
    description: "Berjer formunda, sarmal kollu tekli bouclé koltuk.",
    category: ProductCategory.KOLTUK,
    price: "12500.00",
    stockQuantity: 18,
    collection: "Bouclé Serisi",
    designer: "Rosadore Atelier",
    modelInfo: "Berjer / Lounge",
    widthCm: 95, depthCm: 90, heightCm: 86,
    seatWidthCm: 60, seatDepthCm: 55, seatHeightCm: 45,
    seatCount: 1,
    weightKg: "28.00",
    fabricType: FabricType.BOUCLE,
    fabricColor: "Krem",
    fabricColorHex: "#F5EDE0",
    frameType: FrameType.KAYIN_MASIF,
    foamDensityKgM3: 35,
    durabilityMartindale: 30000,
    warrantyMonths: 24,
    leadTimeDays: 18,
    careInstructions: "Kuru fırça veya nemli mikrofiber bezle silin.",
    images: [
      { url: "/products/seed/boucle-one.png", alt: "Bouclé One tekli koltuk", isCover: true },
    ],
  },
  {
    sku: "CHESTER-MODERN-SET",
    name: "Chester Modern Set",
    description: "Klasik chester düğmelemesinin modern yorumu — ikili + tekli set.",
    category: ProductCategory.KANEPE,
    price: "62000.00",
    stockQuantity: 5,
    collection: "Chester Modern",
    designer: "Rosadore Atelier",
    modelInfo: "Capitone / Tufting",
    widthCm: 240, depthCm: 100, heightCm: 88,
    seatCount: 5,
    weightKg: "128.00",
    fabricType: FabricType.KADIFE,
    fabricColor: "Antrasit",
    fabricColorHex: "#3B3F45",
    frameType: FrameType.KAYIN_MASIF,
    foamDensityKgM3: 40,
    durabilityMartindale: 50000,
    warrantyMonths: 36,
    leadTimeDays: 28,
    careInstructions: "Mikrofiber bezle havı yönünde silin. Su tabanlı leke çıkarıcı kullanın.",
    images: [
      { url: "/products/seed/chester-modern-set.png", alt: "Chester Modern Set", isCover: true },
    ],
  },
  {
    sku: "EPHESUS-3",
    name: "Ephesus Üçlü Kanepe",
    description: "Yivli sırt detayı ve geniş oturumuyla zarif bir tasarım.",
    category: ProductCategory.KANEPE,
    price: "38500.00",
    stockQuantity: 9,
    collection: "Antik Serisi",
    designer: "Rosadore Studio",
    modelInfo: "Yivli sırt",
    widthCm: 235, depthCm: 100, heightCm: 90,
    seatWidthCm: 195, seatDepthCm: 62, seatHeightCm: 46,
    seatCount: 3,
    weightKg: "72.00",
    fabricType: FabricType.CHENILLE,
    fabricColor: "Açık Bej",
    fabricColorHex: "#D7C7AE",
    frameType: FrameType.KAYIN_MASIF,
    foamDensityKgM3: 38,
    durabilityMartindale: 45000,
    warrantyMonths: 24,
    leadTimeDays: 22,
    careInstructions: "Profesyonel kumaş temizliği önerilir.",
    images: [
      { url: "/products/seed/ephesus.png", alt: "Ephesus üçlü", isCover: true },
      { url: "/products/seed/ephesus-arm.png", alt: "Kolçak detayı" },
      { url: "/products/seed/ephesus-detail-1.png", alt: "Yan detay" },
      { url: "/products/seed/ephesus-detail-2.png", alt: "Sırt detayı" },
    ],
  },
  {
    sku: "OLYMPOS-3",
    name: "Olympos Üçlü Kanepe",
    description: "Altın varak ayrıntılı kolçaklar ve şeritli sırt — ihtişamlı bir klasik.",
    category: ProductCategory.KANEPE,
    price: "45000.00",
    stockQuantity: 7,
    collection: "Antik Serisi",
    designer: "Rosadore Studio",
    modelInfo: "Klasik kolçak",
    widthCm: 240, depthCm: 102, heightCm: 96,
    seatWidthCm: 196, seatDepthCm: 60, seatHeightCm: 47,
    seatCount: 3,
    weightKg: "84.00",
    fabricType: FabricType.KADIFE,
    fabricColor: "Şampanya",
    fabricColorHex: "#E2CFA8",
    frameType: FrameType.KAYIN_MASIF,
    foamDensityKgM3: 40,
    durabilityMartindale: 50000,
    warrantyMonths: 36,
    leadTimeDays: 30,
    careInstructions: "Hav yönünde fırçalayın; kuru temizleme önerilir.",
    images: [
      { url: "/products/seed/olympos.png", alt: "Olympos üçlü", isCover: true },
      { url: "/products/seed/olympos-arm.png", alt: "Kolçak detayı" },
      { url: "/products/seed/olympos-arm-2.png", alt: "Kolçak yakın detay" },
    ],
  },
  {
    sku: "TUFTED-ROYALE-3",
    name: "Tufted Royale Üçlü Kanepe",
    description: "Capitone döşemesi ve ahşap ayak detaylarıyla soylu bir duruş.",
    category: ProductCategory.KANEPE,
    price: "47500.00",
    stockQuantity: 6,
    collection: "Royale",
    designer: "Rosadore Atelier",
    modelInfo: "Capitone / Wooden legs",
    widthCm: 230, depthCm: 98, heightCm: 88,
    seatWidthCm: 190, seatDepthCm: 60, seatHeightCm: 46,
    seatCount: 3,
    weightKg: "78.00",
    fabricType: FabricType.KADIFE,
    fabricColor: "Saks Mavi",
    fabricColorHex: "#1F3A8A",
    frameType: FrameType.KAYIN_MASIF,
    foamDensityKgM3: 40,
    durabilityMartindale: 50000,
    warrantyMonths: 36,
    leadTimeDays: 28,
    careInstructions: "Kadife için hav yönünde fırçalayın.",
    images: [
      { url: "/products/seed/tufted-royale.png", alt: "Tufted Royale", isCover: true },
      { url: "/products/seed/tufted-royale-arm.png", alt: "Kolçak detayı" },
      { url: "/products/seed/tufted-royale-back.png", alt: "Sırt detayı" },
      { url: "/products/seed/tufted-royale-leg.png", alt: "Ayak detayı" },
    ],
  },
  {
    sku: "TUFTED-ROYALE-SET",
    name: "Tufted Royale Set (3+2+1)",
    description: "Tufted Royale serisinin tam takım kombinasyonu.",
    category: ProductCategory.KANEPE,
    price: "84000.00",
    stockQuantity: 3,
    collection: "Royale",
    designer: "Rosadore Atelier",
    modelInfo: "Set 3+2+1",
    widthCm: 230, depthCm: 98, heightCm: 88,
    seatCount: 6,
    weightKg: "168.00",
    fabricType: FabricType.KADIFE,
    fabricColor: "Saks Mavi",
    fabricColorHex: "#1F3A8A",
    frameType: FrameType.KAYIN_MASIF,
    foamDensityKgM3: 40,
    durabilityMartindale: 50000,
    warrantyMonths: 36,
    leadTimeDays: 35,
    careInstructions: "Kadife için hav yönünde fırçalayın.",
    images: [
      { url: "/products/seed/tufted-royale-set.png", alt: "Tufted Royale Set", isCover: true },
    ],
  },
  {
    sku: "VELORIA-L",
    name: "Veloria L Köşe Kanepe",
    description: "L formunda geniş köşe; aileler ve modern oturma alanları için.",
    category: ProductCategory.KANEPE,
    price: "58000.00",
    stockQuantity: 4,
    collection: "Veloria",
    designer: "Rosadore Studio",
    modelInfo: "L köşe / Sağ kollu",
    widthCm: 320, depthCm: 200, heightCm: 84,
    seatWidthCm: 280, seatDepthCm: 65, seatHeightCm: 44,
    seatCount: 6,
    weightKg: "145.00",
    fabricType: FabricType.CHENILLE,
    fabricColor: "Vizon",
    fabricColorHex: "#A99280",
    frameType: FrameType.KARMA,
    foamDensityKgM3: 38,
    durabilityMartindale: 40000,
    warrantyMonths: 24,
    leadTimeDays: 30,
    careInstructions: "Su tabanlı leke çıkarıcı kullanılabilir.",
    images: [
      { url: "/products/seed/veloria-l.png", alt: "Veloria L köşe kanepe", isCover: true },
    ],
  },
  {
    sku: "SOMINE-CHESTER",
    name: "Şömine Chester",
    description: "Klasik chester süsleme ile yapılı, salonlara karakter katan dekoratif şömine ünitesi.",
    category: ProductCategory.SOMINE,
    price: "18500.00",
    stockQuantity: 8,
    collection: "Şömine",
    modelInfo: "Dekoratif (elektrikli alev efektli)",
    widthCm: 140, depthCm: 30, heightCm: 110,
    weightKg: "55.00",
    fabricType: FabricType.YOK,
    frameType: FrameType.YOK,
    warrantyMonths: 24,
    leadTimeDays: 20,
    careInstructions: "Kuru bezle silin. Yanıcı malzemelerden uzak tutun.",
    images: [
      { url: "/products/seed/somine-chester.png", alt: "Şömine Chester", isCover: true },
    ],
  },
  {
    sku: "SOMINE-MODERN",
    name: "Şömine Modern",
    description: "Sade hatlı modern dekoratif şömine ünitesi.",
    category: ProductCategory.SOMINE,
    price: "16000.00",
    stockQuantity: 10,
    collection: "Şömine",
    modelInfo: "Dekoratif (elektrikli alev efektli)",
    widthCm: 130, depthCm: 28, heightCm: 100,
    weightKg: "48.00",
    fabricType: FabricType.YOK,
    frameType: FrameType.YOK,
    warrantyMonths: 24,
    leadTimeDays: 18,
    careInstructions: "Kuru bezle silin. Yanıcı malzemelerden uzak tutun.",
    images: [
      { url: "/products/seed/somine-modern.png", alt: "Şömine Modern", isCover: true },
    ],
  },
];

async function main() {
  console.log("→ Seeding ROSADORE HOME B2B database…");

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
          companyName: "Yılmaz Mobilya Ltd. Şti.",
          taxNumber: "1112223334",
          phone: "+90 532 000 00 01",
          address: "Bağdat Cad. No:120 Kadıköy / İstanbul",
          discountPercentage: new Prisma.Decimal("10.00"),
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
          companyName: "Kaya Home Concept A.Ş.",
          taxNumber: "5556667778",
          phone: "+90 532 000 00 02",
          address: "Kordon Bulvarı No:30 Konak / İzmir",
          discountPercentage: new Prisma.Decimal("15.00"),
        },
      },
      cart: { create: {} },
    },
  });

  // Eski ürünleri (FabrikaFiyat seed'i + jenerik B2B seed'i) temizle
  await prisma.cartItem.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.customerProductPrice.deleteMany({});
  // Ürünleri tek tek upsert et — sipariş varsa korunur
  // Depo seed
  const mainWh = await prisma.warehouse.upsert({
    where: { code: "ANK-1" },
    update: {},
    create: { name: "Ana Depo (Ankara)", code: "ANK-1", isDefault: true, address: "Ankara OSB" },
  });
  const istWh = await prisma.warehouse.upsert({
    where: { code: "IST-1" },
    update: {},
    create: { name: "İstanbul Showroom Stok", code: "IST-1", address: "İstanbul Atışalanı" },
  });

  // Konfigüratör seçenekleri — kategori bazlı default'lar
  const SOFA_FABRIC_COLORS = [
    { name: "Krem", hex: "#F5EDE0" },
    { name: "Antrasit", hex: "#3B3F45" },
    { name: "Saks Mavi", hex: "#1F3A8A" },
    { name: "Vizon", hex: "#A99280" },
    { name: "Yeşil", hex: "#3F6B53" },
  ];
  const SOFA_COMPOSITIONS = [
    { label: "Tekli", priceMultiplier: 0.4 },
    { label: "İkili", priceMultiplier: 0.7 },
    { label: "Üçlü", priceMultiplier: 1.0 },
    { label: "Set 3+2", priceMultiplier: 1.6 },
    { label: "Set 3+2+1", priceMultiplier: 2.0 },
    { label: "L Köşe", priceMultiplier: 1.8 },
  ];
  const SOFA_ADDONS = [
    { label: "Şömine Modern", priceDelta: 16000 },
    { label: "Şömine Chester", priceDelta: 18500 },
    { label: "Sehpa Takımı", priceDelta: 8500 },
    { label: "Vitrin", priceDelta: 22000 },
    { label: "TV Ünitesi", priceDelta: 14000 },
  ];
  const FIREPLACE_COLORS = [
    { name: "Beyaz", hex: "#F8F4ED" },
    { name: "Antrasit", hex: "#3B3F45" },
  ];

  for (const p of PRODUCTS) {
    const { images, ...productData } = p;
    const isSofa = productData.category === ProductCategory.KANEPE || productData.category === ProductCategory.KOLTUK;
    const productPayload: any = {
      ...productData,
      price: new Prisma.Decimal(productData.price),
      vatRate: new Prisma.Decimal(productData.vatRate ?? "20.00"),
      weightKg: productData.weightKg ? new Prisma.Decimal(productData.weightKg) : null,
      unit: productData.unit ?? "adet",
      availableFabricColors: isSofa ? SOFA_FABRIC_COLORS : FIREPLACE_COLORS,
      availableCompositions: isSofa ? SOFA_COMPOSITIONS : null,
      availableAddons: isSofa ? SOFA_ADDONS : null,
    };

    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: productPayload,
      create: productPayload,
    });

    // Görselleri sıfırdan yükle
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: img.url,
          alt: img.alt,
          sortOrder: i,
          isCover: img.isCover ?? i === 0,
        },
      });
    }

    // Stok'u her depoya dağıt — %70 ana depo, %30 istanbul
    const main = Math.round(productData.stockQuantity * 0.7);
    const ist = productData.stockQuantity - main;
    await prisma.warehouseStock.upsert({
      where: { warehouseId_productId: { warehouseId: mainWh.id, productId: product.id } },
      update: { stockQuantity: main },
      create: { warehouseId: mainWh.id, productId: product.id, stockQuantity: main },
    });
    await prisma.warehouseStock.upsert({
      where: { warehouseId_productId: { warehouseId: istWh.id, productId: product.id } },
      update: { stockQuantity: ist },
      create: { warehouseId: istWh.id, productId: product.id, stockQuantity: ist },
    });
  }

  // Müşteriye özel fiyat örneği — Ahmet Yılmaz Bouclé Normal'ı özel fiyatla alıyor
  const boucle = await prisma.product.findUnique({ where: { sku: "BOUCLE-NORMAL-3" } });
  if (boucle) {
    await prisma.customerProductPrice.upsert({
      where: { customerId_productId: { customerId: customer1.id, productId: boucle.id } },
      update: { price: new Prisma.Decimal("28000.00") },
      create: { customerId: customer1.id, productId: boucle.id, price: new Prisma.Decimal("28000.00") },
    });
  }

  console.log(`✓ Admin: ${admin.email} / admin123`);
  console.log(`✓ Customer 1: ${customer1.email} / customer123 (10% iskonto + Bouclé Normal özel fiyat)`);
  console.log(`✓ Customer 2: ${customer2.email} / customer123 (15% iskonto)`);
  console.log(`✓ Products: ${PRODUCTS.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
