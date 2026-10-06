# B2B Wholesale Platform

Wholesale ordering platform for European retailers. You sell products sourced from manufacturers in Türkiye under **your own brand**, invoiced by **your Romanian company**. Trucks (TIR) deliver straight from the workshop to each store, with no warehouse in between, and you handle transport and customs.

## Built around how furniture stores actually import
| Typical pain | What the app does |
|---|---|
| Freight and customs surprises | Prices are **delivered**: production, packing, road freight and EU clearance (A.TR, no duty) are included. One EU invoice from the Romanian company. |
| Can't fill a full truck | **Shared trucks (groupage):** stores book space on scheduled departures and only pay for their m³. Each truck shows a booking deadline, free space and how many stores are on it. |
| Cash locked up for months | **30% deposit** starts production; the balance is due before loading (or pay in full). |
| No idea where the goods are | **Live tracking:** a tilted, animated route map from Istanbul to the store, the truck plate, ETA and every update you post. |
| Buying fabric blind | **3D fabric viewer** (velvet / bouclé / linen-look) and a free **swatch kit** request. |
| "Will it sell, what's my margin?" | **Margin calculator** on every product (editable retail price and VAT), plus trend filters (sofa bed, curved, bouclé, storage…). |
| Damage disputes | **Claims** per piece straight from the delivered order; admin resolves them on one screen. |

## Experience
- **3D everywhere:** every product is modelled procedurally from its dimensions (sofas, sofa beds that animate open, corner and curved modular sofas, armchairs, beds, poufs and benches), with fabric that morphs when you switch swatches and a dimension overlay. Catalog cards share a single WebGL canvas, so a whole grid of 3D models stays fast.
- **3D load planner:** the cart and checkout show your pieces packed into a 13.6 m trailer next to the other stores' load on the truck you pick.
- **Motion:** smooth scrolling, staggered reveals, headlines that rise word by word, a live booking countdown and an animated route.
- **Design:** warm bone/ink/terracotta palette, Instrument Serif + Instrument Sans + JetBrains Mono, hairlines and dimension-line details borrowed from technical drawings. Printable **product sheets** with an auto-generated technical drawing for the shop floor.

## Admin
- Products, categories, catalog import (JSON / Alibaba scraper). Manufacturer, purchase price, source URL and margin are visible **only to you**.
- Trade account approvals, orders (record deposit / balance), claims, swatch kits.
- **Trucks:** plan a truck, open it for booking (deadline, planned departure, usable m³), add orders and post tracking updates. Every store on the truck sees the update and their orders move to the matching status.

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
npm run db:seed             # admin, catalog from data/catalog.json, demo stores, trucks and orders
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
Next.js 15 (App Router, server actions) · TypeScript · Tailwind CSS · Three.js / React Three Fiber / drei · Motion · Lenis · Prisma · Stripe Checkout · JWT cookie sessions.

`node scripts/smoke-test.mjs` runs an end-to-end browser test: browse, order on a shared truck with a deposit, admin records the deposit and moves the truck, buyer tracks it (app must be running on :3000).
