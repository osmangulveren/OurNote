const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.cartItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();

  const options = {
    configuration: [
      { value: '2li', label: "2'li", priceModifier: 0 },
      { value: '3lu', label: "3'lü", priceModifier: 4500 },
      { value: 'l-koltuk', label: 'L Koltuk', priceModifier: 8500 }
    ],
    fabricColor: [
      { value: 'gri', label: 'Gri', hex: '#8c8f95', priceModifier: 0 },
      { value: 'bej', label: 'Bej', hex: '#d7c5a4', priceModifier: 0 },
      { value: 'antrasit', label: 'Antrasit', hex: '#4f5963', priceModifier: 400 },
      { value: 'lacivert', label: 'Lacivert', hex: '#1f3b73', priceModifier: 500 },
      { value: 'tas', label: 'Taş', hex: '#b9aea3', priceModifier: 0 },
      { value: 'krem', label: 'Krem', hex: '#efe6d8', priceModifier: 200 },
      { value: 'yesil', label: 'Yeşil', hex: '#657a58', priceModifier: 350 },
      { value: 'hardal', label: 'Hardal', hex: '#caa23f', priceModifier: 300 },
      { value: 'bordo', label: 'Bordo', hex: '#782f40', priceModifier: 350 },
      { value: 'siyah', label: 'Siyah', hex: '#1d1d1f', priceModifier: 450 }
    ],
    frameType: [
      { value: 'ahsap', label: 'Ahşap', priceModifier: 0 },
      { value: 'metal', label: 'Metal', priceModifier: 1200 },
      { value: 'karisik', label: 'Karışık', priceModifier: 700 }
    ],
    armShape: [
      { value: 'duz', label: 'Düz', icon: '▭', priceModifier: 0 },
      { value: 'yuvarlak', label: 'Yuvarlak', icon: '◖', priceModifier: 250 },
      { value: 'modern', label: 'Modern', icon: '◫', priceModifier: 500 }
    ],
    legStyle: [
      { value: 'ahsap-ceviz', label: 'Ceviz Ahşap', icon: '🪵', priceModifier: 0 },
      { value: 'siyah-metal', label: 'Siyah Metal', icon: '⚫', priceModifier: 300 },
      { value: 'altin-metal', label: 'Altın Metal', icon: '🟡', priceModifier: 900 }
    ]
  };

  await prisma.product.createMany({
    data: [
      {
        name: 'Milano L Koltuk',
        basePrice: 21990,
        retailPrice: 34990,
        category: 'sofa',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80'
        ]),
        availableOptions: JSON.stringify(options)
      },
      {
        name: 'Roma 3\'lü Koltuk',
        basePrice: 17490,
        retailPrice: 28990,
        category: 'sofa',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1582582494700-c76e2fabf6dd?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1616627452094-7fbb3f1a7ef0?auto=format&fit=crop&w=1200&q=80'
        ]),
        availableOptions: JSON.stringify(options)
      }
    ]
  });
}

main().finally(async () => {
  await prisma.$disconnect();
});
