/**
 * Best-effort scraper for an Alibaba.com supplier storefront.
 *
 *   npm run catalog:scrape -- "https://<supplier>.en.alibaba.com/productlist.html"
 *
 * Opens the store's product list in a real browser, follows every product page and
 * writes data/scraped-<timestamp>.json in the same format as data/catalog.json.
 * Review the file (rename products to your brand, set your selling prices) and import it:
 *
 *   npm run catalog:import -- data/scraped-<timestamp>.json
 *
 * Alibaba changes its markup often and may show captchas; run it with HEADLESS=0 to watch / solve them.
 * Prices on Alibaba are FOB purchase prices in USD: they are stored as supplierPrice, and the EUR selling price
 * is set to supplierPrice × MARKUP (default 1.8 — include currency, freight, customs and margin) as a starting point.
 */
import { writeFileSync } from "node:fs";
import { chromium, type Page } from "playwright";
import { slugify } from "../lib/format";

const start = process.argv[2];
if (!start) {
  console.error("Usage: npm run catalog:scrape -- <alibaba store or product-list URL>");
  process.exit(1);
}
const MARKUP = Number(process.env.MARKUP ?? 1.8);
const LIMIT = Number(process.env.LIMIT ?? 500);

type Scraped = {
  url: string; title: string; category: string; images: string[]; tiers: { minQty: number; price: number }[];
  moq: number; unit: string; attributes: { label: string; value: string }[]; description: string;
};

async function collectProductLinks(page: Page) {
  const links = new Set<string>();
  let url: string | null = start.includes("productlist") || start.includes("productgrouplist")
    ? start
    : new URL("/productlist.html", start).toString();
  for (let n = 0; url && n < 50; n++) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(2500);
    for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 2500); await page.waitForTimeout(400); }
    const found = await page.$$eval("a[href*='/product/'], a[href*='product-detail']", (as) =>
      as.map((a) => (a as HTMLAnchorElement).href.split("?")[0]));
    const before = links.size;
    found.forEach((l) => links.add(l));
    console.log(`page ${n + 1}: ${links.size} product links`);
    if (links.size === before) break;
    url = await page.$eval("a.next, a[class*='next'], li.next a", (a) => (a as HTMLAnchorElement).href).catch(() => null);
  }
  return [...links].slice(0, LIMIT);
}

async function scrapeProduct(page: Page, url: string): Promise<Scraped> {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(2000);
  return page.evaluate((u) => {
    const text = (sel: string) => document.querySelector(sel)?.textContent?.trim() ?? "";
    const title = text("h1") || document.title.replace(/ - Buy .*$/, "");
    const images = [...new Set(
      [...document.querySelectorAll("img")]
        .map((i) => i.getAttribute("src") || i.getAttribute("data-src") || "")
        .filter((s) => /alicdn\.com\/kf\//.test(s))
        .map((s) => (s.startsWith("//") ? `https:${s}` : s).replace(/_\d+x\d+.*$/, "")),
    )].slice(0, 8);
    // Price ladder, e.g. "2 - 9 pieces  $250" / "≥ 10 pieces  $230"
    const tiers: { minQty: number; price: number }[] = [];
    let unit = "pcs";
    document.querySelectorAll("[class*='price-item'], [class*='ladder-price'] > div, [class*='price-list'] > div").forEach((el) => {
      const t = el.textContent ?? "";
      const q = t.match(/(\d[\d,]*)\s*(?:-|~|\+|≥|>=|pieces|sets|units)/i) ?? t.match(/≥\s*(\d[\d,]*)/);
      const p = t.match(/\$\s?([\d,.]+)/);
      const um = t.match(/(pieces|piece|sets|set|units|unit)/i);
      if (um) unit = /set/i.test(um[1]) ? "set" : "pcs";
      if (q && p) tiers.push({ minQty: Number(q[1].replace(/,/g, "")), price: Number(p[1].replace(/,/g, "")) });
    });
    if (tiers.length === 0) {
      const p = document.body.innerText.match(/\$\s?([\d,.]+)/);
      if (p) tiers.push({ minQty: 1, price: Number(p[1].replace(/,/g, "")) });
    }
    const moqMatch = document.body.innerText.match(/Min\.?\s*order[^\d]*(\d[\d,]*)/i);
    const attributes: { label: string; value: string }[] = [];
    document.querySelectorAll("[class*='attribute'] [class*='item'], .do-entry-item, table tr").forEach((row) => {
      const cells = row.querySelectorAll("[class*='left'], [class*='name'], dt, th, td");
      if (cells.length >= 2) {
        const label = cells[0].textContent?.trim().replace(/:$/, "") ?? "";
        const value = cells[cells.length - 1].textContent?.trim() ?? "";
        if (label && value && label.length < 40 && value.length < 200 && label !== value) attributes.push({ label, value });
      }
    });
    const crumbs = [...document.querySelectorAll("[class*='breadcrumb'] a")].map((a) => a.textContent?.trim() ?? "");
    return {
      url: u, title, images, tiers: tiers.sort((a, b) => a.minQty - b.minQty),
      moq: moqMatch ? Number(moqMatch[1].replace(/,/g, "")) : tiers[0]?.minQty ?? 1,
      unit, attributes: attributes.slice(0, 25),
      category: crumbs.at(-1) || "Uncategorized",
      description: (document.querySelector("meta[name=description]") as HTMLMetaElement | null)?.content ?? "",
    };
  }, url);
}

const ATTR_HINTS: [RegExp, "dimensions" | "material" | "colors"][] = [
  [/size|dimension/i, "dimensions"], [/material|fabric/i, "material"], [/colou?r/i, "colors"],
];

async function main() {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== "0",
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  });
  const page = await browser.newPage({ locale: "en-US", viewport: { width: 1400, height: 1000 } });
  const links = await collectProductLinks(page);
  console.log(`Found ${links.length} products`);
  const scraped: Scraped[] = [];
  for (const [i, l] of links.entries()) {
    try {
      const p = await scrapeProduct(page, l);
      scraped.push(p);
      console.log(`${i + 1}/${links.length} ${p.title.slice(0, 70)}`);
    } catch (e) {
      console.warn(`skip ${l}: ${(e as Error).message}`);
    }
  }
  await browser.close();

  const categories = [...new Set(scraped.map((s) => s.category))].map((name) => ({ slug: slugify(name), name, description: "" }));
  const products = scraped.filter((s) => s.tiers.length > 0).map((s, i) => {
    const pick = (k: string) => s.attributes.find((a) => ATTR_HINTS.some(([re, key]) => key === k && re.test(a.label)))?.value ?? "";
    const base = s.tiers[0].price;
    return {
      sku: `P-${String(i + 1).padStart(3, "0")}`,
      name: s.title.slice(0, 120),
      category: slugify(s.category),
      shortDescription: s.description.slice(0, 160),
      description: s.description,
      images: s.images,
      price: Math.round(base * MARKUP),
      priceTiers: s.tiers.slice(1).map((t) => ({ minQty: t.minQty, price: Math.round(t.price * MARKUP) })),
      moq: Math.max(1, s.moq),
      unit: s.unit,
      dimensions: pick("dimensions"),
      material: pick("material"),
      colors: pick("colors") ? pick("colors").split(/[,/]/).map((c) => c.trim()).filter(Boolean) : [],
      specs: s.attributes,
      supplierPrice: base,
      sourceUrl: s.url,
    };
  });
  const out = `data/scraped-${Date.now()}.json`;
  writeFileSync(out, JSON.stringify({ source: start, categories, products }, null, 2));
  console.log(`Wrote ${products.length} products to ${out}. Review, then: npm run catalog:import -- ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
