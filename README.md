# B2B Tedarik / Stok / Sipariş MVP

Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL üzerine kurulu, B2B
müşterilerin ürün katalogundan sepet üzerinden sipariş verebildiği, admin'in
ürün/sipariş/müşteri yönetip taslak fatura ve haftalık ön muhasebe raporu
üretebildiği MVP uygulamasıdır.

> ⚠️ Bu MVP gerçek ödeme entegrasyonu **içermez** ve fatura çıktısı resmi
> e-Fatura/e-Arşiv değildir. Sadece "taslak / proforma" amaçlıdır.

---

## Stack

- **Frontend / Backend:** Next.js 14 (App Router), Server Actions
- **Dil:** TypeScript
- **DB:** PostgreSQL 16 (docker-compose ile lokal)
- **ORM:** Prisma 5 (Decimal — kuruş hassasiyeti)
- **Auth:** NextAuth v5 (Credentials), bcryptjs hash, JWT session
- **Validasyon:** zod (server-side)
- **Stil:** Tailwind CSS

---

## Hızlı kurulum

Ön gereksinimler: **Node.js 20+**, **Docker**, **npm**.

```bash
# 1) Repo klasörüne girin (zaten içindeyseniz atlayın)

# 2) Bağımlılıkları yükleyin
npm install

# 3) PostgreSQL'i başlatın
docker compose up -d

# 4) Env değişkenlerini hazırlayın
cp .env.example .env
# (gerekirse AUTH_SECRET'i değiştirin)

# 5) Şemayı uygulayın ve veriyi seed'leyin
npm run db:push
npm run db:seed

# 6) Uygulamayı çalıştırın
npm run dev
# → http://localhost:3000
```

### Demo kullanıcılar

| Rol      | Email                  | Şifre        |
|----------|------------------------|--------------|
| ADMIN    | admin@example.com      | admin123     |
| CUSTOMER | musteri1@example.com   | customer123  |
| CUSTOMER | musteri2@example.com   | customer123  |

---

## Komutlar

| Komut                    | Açıklama                                          |
|--------------------------|---------------------------------------------------|
| `npm run dev`            | Next.js dev server                                |
| `npm run build`          | Production build                                  |
| `npm run start`          | Production server                                 |
| `npm run lint`           | ESLint                                            |
| `npm run db:push`        | Prisma şemasını DB'ye uygular                     |
| `npm run db:seed`        | Demo veriyi (admin + 2 müşteri + ürünler) yükler  |
| `npm run db:studio`      | Prisma Studio (DB browser)                        |
| `npm run report:weekly`  | Haftalık ön muhasebe raporu job'unu çalıştırır    |

---

## Env değişkenleri (`.env`)

```env
DATABASE_URL="postgresql://b2b:b2b@localhost:5432/b2b_supply?schema=public"
AUTH_SECRET="dev-secret-change-me-please"
AUTH_TRUST_HOST="true"
NEXTAUTH_URL="http://localhost:3000"
ACCOUNTANT_EMAIL="accountant@example.com"
COMPANY_NAME="Örnek Tedarik A.Ş."
COMPANY_TAX_NUMBER="1234567890"
COMPANY_ADDRESS="Atatürk Cad. No:1 Çankaya / Ankara"
```

`COMPANY_*` değişkenleri taslak fatura çıktısında satıcı bilgisi olarak kullanılır.

---

## MVP Kapsamı

### Authentication
- Email + şifre ile giriş (NextAuth Credentials provider)
- Roller: `ADMIN`, `CUSTOMER`
- Route guard: `middleware.ts` üzerinden role-based erişim kontrolü
- Müşteri başka müşterinin siparişine/faturasına erişemez (sayfa & action seviyesinde kontrol)

### Admin Panel (`/admin`)
- Genel bakış (ürün/müşteri/sipariş özetleri, son siparişler, stok azalanlar)
- Ürünler: liste, oluştur, düzenle (`/admin/products`, `/admin/products/new`, `/admin/products/[id]`)
- Siparişler: liste & detay (`/admin/orders`, `/admin/orders/[id]`)
- Sipariş durumu değişimi: `PENDING → APPROVED/CANCELLED`, `APPROVED → PREPARING/CANCELLED`, `PREPARING → SHIPPED/CANCELLED`
- Müşteriler (`/admin/customers`)
- Ön muhasebe raporu (`/admin/accounting`) + CSV export (`/admin/accounting/csv`)
- Sipariş detayından **taslak/proforma fatura** üretme

### Müşteri Paneli (`/customer`)
- Aktif ürün katalogu, kullanılabilir stok (`stockQuantity - reservedQuantity`)
- Sepete ekle / sepette miktar güncelle / kaldır
- Sipariş ver
- Kendi sipariş geçmişi & detayları
- Sadece kendi siparişine ait fatura taslağı görme

### Sipariş Akışı & Stok
- Sipariş oluşturulduğunda stok **düşmez**, `reservedQuantity` artar, `RESERVE` `StockMovement` kaydı oluşur.
- `APPROVED` / `PREPARING` aşamalarında rezervasyon korunur.
- `SHIPPED` olduğunda `stockQuantity` düşer, `reservedQuantity` azaltılır, `SHIP` hareketi kaydedilir.
- `CANCELLED` olduğunda rezervasyon serbest bırakılır, `RELEASE_RESERVATION` kaydı atılır.
- Stok eksiye düşmesi engellenir; transaction içinde kontrol edilir.
- Tüm para hesapları Prisma `Decimal` ile yapılır (floating point yok).

### Taslak Fatura
- `InvoiceDraft` modeli, sipariş başına 1 taslak.
- `/invoices/[id]` print-friendly HTML fatura sayfası.
- Sayfada açıkça "**Bu belge resmi e-Fatura/e-Arşiv değildir. MVP taslak/proforma çıktısıdır.**" uyarısı.
- "Muhasebeye gönder" → `status: READY_FOR_ACCOUNTING` + `lib/invoices/eInvoiceAdapter.ts` stub'unu çağırır.

### Ön Muhasebe Raporu
- Tarih aralığı seçilebilir (varsayılan: son 7 gün).
- Toplam sipariş, toplam satış, KDV toplamı, müşteri/ürün bazlı satışlar, fatura taslakları.
- CSV export (UTF-8 BOM + `;` ayraç → Excel TR uyumlu).
- Servis mimarisi (`lib/accounting/report.ts`) Excel/PDF eklemek için ortak bir veri modeli üretir.

### Haftalık Job Simülasyonu
- `lib/accounting/weeklyReportJob.ts` içinde `runWeeklyReportJob()`.
- Raporu üretir, CSV'yi **console'a yazar** (gerçek email yerine simülasyon).
- `AccountingReportLog` tablosuna kayıt atar.
- Manuel çalıştırma:
  ```bash
  npm run report:weekly
  ```
- Cron örneği (her Pazartesi 09:00):
  ```
  0 9 * * 1  cd /path/to/app && /usr/bin/env -S npm run report:weekly >> /var/log/weekly-report.log 2>&1
  ```
  Production'da: cron yerine bir scheduler (GitHub Actions, Vercel Cron, Railway Cron, k8s CronJob, Supabase pg_cron, vb.) kullanılması önerilir.

---

## Mimari Notlar

```
app/
  login/                 → Credentials login
  admin/                 → ADMIN korumalı sayfalar (layout'ta requireAdmin)
  customer/              → CUSTOMER korumalı sayfalar (requireCustomer)
  invoices/[id]/         → Hem admin hem ilgili müşteriye açık
  api/auth/[...nextauth] → NextAuth handlers
lib/
  auth/session.ts        → requireSession / requireAdmin / requireCustomer
  cart/actions.ts        → Sepet server actions
  orders/actions.ts      → placeOrder, updateOrderStatus (transactional)
  products/actions.ts    → CRUD + StockMovement
  invoices/
    actions.ts           → InvoiceDraft oluştur / muhasebeye gönder
    eInvoiceAdapter.ts   → e-Fatura entegrasyon STUB'u (interface + provider)
  accounting/
    report.ts            → Rapor verisini hesaplar (test edilebilir saf fonksiyon)
    csv.ts               → CSV serializer
    weeklyReportJob.ts   → Haftalık job (simülasyon)
  money.ts               → Decimal yardımcıları + tr-TR formatlayıcılar
  prisma.ts              → Prisma client singleton
prisma/
  schema.prisma          → Tüm modeller
  seed.ts                → Demo veri
middleware.ts            → Role-based route koruması
auth.ts                  → NextAuth config (Credentials)
docker-compose.yml       → Lokal Postgres
scripts/
  run-weekly-report.ts   → Job CLI runner (npm run report:weekly)
```

### Veri Modeli (özet)

`User` ↔ `CustomerProfile` (1-1, opsiyonel) · `Cart` (1-1) · `Order[]` · `InvoiceDraft[]`

`Product` ↔ `CartItem[]` · `OrderItem[]` · `StockMovement[]`

`Order` → `OrderItem[]` · `InvoiceDraft?` · `StockMovement[]`

`AccountingReportLog` her job çalışmasında bir kayıt oluşturur.

---

## Yapılmayanlar (kasıtlı MVP sınırları)

- Gerçek **ödeme entegrasyonu yok**.
- Gerçek **e-Fatura / e-Arşiv yok** — sadece taslak HTML + adapter stub.
- Gerçek **email gönderimi yok** — haftalık rapor console'a yazılır.
- PDF export yok — invoice sayfası tarayıcının "Yazdır → PDF olarak kaydet" özelliği ile PDF üretilebilir.
- Şifre sıfırlama / 2FA / kayıt akışı yok — kullanıcılar admin tarafından oluşturulur (MVP'de seed ile).
- Test suite yok (jest/playwright). `lib/accounting/report.ts` ve `lib/orders/actions.ts` saf-ish olduğu için ileride birim testlerine uygundur.
- i18n yok; UI sabit Türkçe.
- Çoklu depo / lokasyon yok; tek depo varsayımı.

---

## Sonraki Adımlar

1. **Üretim auth**: kayıt akışı, şifre sıfırlama (token + email), oturum süresi yönetimi.
2. **e-Fatura entegrasyonu**: `lib/invoices/eInvoiceAdapter.ts` içine gerçek bir provider (izibiz, Foriba, GIB, vb.) implementasyonu ekleyin.
3. **Email transport**: `lib/accounting/weeklyReportJob.ts`'ye Resend/SES/SMTP transport bağlayın; CSV'yi attachment olarak gönderin.
4. **PDF export**: faturayı puppeteer veya `@react-pdf/renderer` ile PDF'e çevirin.
5. **Excel export**: `lib/accounting/report.ts` çıktısından `xlsx` paketi ile xlsx üretin.
6. **Audit log**: User-attributed audit trail (kim ne zaman hangi siparişin durumunu değiştirdi).
7. **Çoklu depo & barkod / parti yönetimi**.
8. **Web push / email bildirim**: müşteriye sipariş onay/sevk bildirimi.
9. **Test**: Vitest + Prisma test DB ile sipariş akışı/stok geçişlerini izole edin.
10. **CI / Deploy**: GitHub Actions + Vercel/Railway. Cron için Vercel Cron veya Upstash QStash önerilir.
