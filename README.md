# FabrikaFiyat MVP

Mobil öncelikli, üretici fiyatına koltuk satışı için Next.js 14 + Prisma + NextAuth tabanlı MVP.

## Kurulum

```bash
pnpm install
cp .env.example .env
pnpm db:push
pnpm db:seed
pnpm dev
```

Uygulama: `http://localhost:3000`

## Test kullanıcı akışı

- Onboarding ekranında telefon numarası girin.
- OTP adımında `123456` girin.
- Feed'den ürün özelleştirip sepete ekleyin.
- Checkout sonrası başarı ekranında sipariş numarası görünür.
- Profil sayfasında sipariş geçmişi listelenir.

## Ortam değişkenleri

- `DATABASE_URL`: SQLite bağlantısı (lokal geliştirme için `file:./dev.db`)
- `AUTH_SECRET`: NextAuth imza anahtarı
- `AUTH_TRUST_HOST`: Lokalde `true`

## Mimari kararlar

1. **Hız / UX**: Mobil first tek kolon düzen + sticky CTA + client-side cart store (Zustand) ile akıcı akış.
2. **Düşük sürtünme**: Feed → customizer → cart akışında maksimum 3 tık.
3. **MVP güvenliği**: OTP mock, ödeme mock ve sipariş persist edildiği minimal ama gerçekçi backend.
4. **Esnek veri modeli**: `availableOptions` ve `selectedOptions` JSON yapısı ile kategori genişletmeye uygun şema.
