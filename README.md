# B2B Wholesale Platform

Wholesale ordering platform for European retailers. You sell products sourced from manufacturers in Türkiye under **your own brand**, invoiced by **your Romanian company**. Trucks (TIR) deliver straight from the workshop to each store, with no warehouse in between, and you handle transport and customs.

## What store owners can do
- Browse the catalog by category. Prices are only shown to approved trade accounts.
- Apply for a trade account with company and VAT details. You approve each one.
- Order in wholesale quantities, with a minimum order quantity (MOQ) and volume price tiers. The cart shows how much truck space the order takes.
- Pay online by card or SEPA through Stripe, or by bank transfer with a proforma invoice.
- Track every order: *placed → paid → in production → loading → on the road → customs → out for delivery → delivered*. The order page shows a live truck card with plate, route, ETA, driver and location updates.
- Print invoices or proformas, and reorder in one click.

## What you (admin) can do
- **Products**: create and edit products and categories, set price tiers, MOQ, packed volume and weight, specs and colours. Internal sourcing fields (manufacturer, purchase price, source URL) and margin are visible **only to you**.
- **Import**: upload a catalog JSON. Products are matched by SKU and updated, never deleted.
- **Customers**: approve or reject trade applications.
- **Orders**: change status, mark bank transfers as paid, see the margin per order.
- **Trucks (TIR)**: plan a truck, put paid orders on it (with a load % of the trailer) and post tracking updates (*Departed Istanbul*, *At Kapıkule*, …). Every store on the truck sees the update, and their orders move to the matching status automatically. Mark each store's order as delivered when the truck unloads.

## VAT logic (Romanian seller)
| Buyer | VAT |
|---|---|
| Romania | Romanian VAT (`VAT_RATE_RO`, default 21%) |
| Other EU country **with** VAT ID | 0%, intra-community reverse charge |
| Other EU country without VAT ID | Romanian VAT |
| Outside the EU (CH, NO, UK…) | 0%, export |

Check VAT IDs in VIES before approving accounts. Confirm the final invoicing setup with your accountant.

## Quick start
```bash
npm install
cp .env.example .env        # set brand, company, IBAN, Stripe keys
npx prisma db push          # create the SQLite database
npm run db:seed             # admin user, catalog from data/catalog.json, demo buyer + truck
npm run dev                 # http://localhost:3000
```
Logins after seeding:
- Admin: `admin@example.com` / `admin12345` (change `ADMIN_EMAIL`/`ADMIN_PASSWORD` before seeding).
- Demo buyer: `buyer@example.com` / `buyer12345`.

## Catalog: replacing the demo products
`data/catalog.json` currently contains **demo products** (furniture). Replace it with your real catalog in one of three ways:

1. **Scrape an Alibaba supplier store** (needs network access to `alibaba.com` and `alicdn.com`):
   ```bash
   npm run catalog:scrape -- "https://<supplier>.en.alibaba.com/productlist.html"
   # review data/scraped-*.json: rename products to your brand and check prices
   npm run catalog:import -- data/scraped-<timestamp>.json
   ```
   Alibaba prices are stored as the internal purchase price, and selling prices start at purchase × `MARKUP` (default 1.8).
2. **Admin → Import catalog**: upload or paste JSON in the same format.
3. **Admin → Products → New product**: add products by hand.

Product images use a placeholder until image URLs are set. For production, host images on your own storage or CDN instead of hot-linking Alibaba.

## Stripe (optional)
Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`, then point a webhook at `/api/stripe/webhook` for `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Without a key, only bank transfer is offered.

## Production
- Switch `provider` in `prisma/schema.prisma` to `postgresql` and set `DATABASE_URL`.
- Set a long random `SESSION_SECRET` and the real `APP_URL`.
- `npm run build && npm start` (or deploy to Vercel or any Node host).

## Tech
Next.js 15 (App Router, server actions) · TypeScript · Tailwind CSS · Prisma · Stripe Checkout · JWT cookie sessions.

`node scripts/smoke-test.mjs` runs an end-to-end browser test of the main flows (app must be running on :3000).
