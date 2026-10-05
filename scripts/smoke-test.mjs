// End-to-end smoke test of the main flows. Run with the app on :3000: node scripts/smoke-test.mjs [screenshotDir]
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const shots = process.argv[2];
const exe = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const shot = async (page, name) => shots && page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });
const ok = (cond, msg) => { if (!cond) throw new Error(`FAIL: ${msg}`); console.log(`✓ ${msg}`); };

async function login(email, password) {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/login")), page.click("button:has-text('Log in')")]);
  return page;
}

// Guest: catalog visible, prices hidden
const guest = await (await browser.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
await guest.goto(BASE);
await shot(guest, "01-home");
await guest.goto(`${BASE}/catalog`);
ok((await guest.content()).includes("Log in for price"), "guest sees catalog without prices");

// Buyer: order with bank transfer
const buyer = await login("buyer@example.com", "buyer12345");
await buyer.goto(`${BASE}/catalog?category=sofa-beds`);
await shot(buyer, "02-catalog");
await buyer.click("text=Milano 3-Seater Sofa Bed with Storage");
await buyer.waitForURL(/\/products\//);
await shot(buyer, "03-product");
await buyer.fill("input[name=quantity]", "12");
await Promise.all([buyer.waitForURL(/\/cart/), buyer.click("button:has-text('Add & checkout')")]);
await shot(buyer, "04-cart");
ok((await buyer.content()).includes("€4,428.00"), "tier price applied (12 × €369)");
await buyer.click("text=Proceed to checkout");
await buyer.waitForURL(/\/checkout/);
await Promise.all([buyer.waitForURL(/\/orders\/.+placed=1/), buyer.click("button:has-text('Place order')")]);
await shot(buyer, "05-order-placed");
const orderUrl = buyer.url().split("?")[0];
const orderNo = await buyer.locator("h1").innerText();
ok(orderNo.includes("ORD-"), `order placed: ${orderNo.split("\n")[0]}`);
ok((await buyer.content()).includes("reverse charge"), "DE buyer with VAT ID gets reverse charge");

// Admin: mark paid, create truck, add order, post update
const admin = await login("admin@example.com", "admin12345");
await shot(admin, "06-admin-dashboard");
await admin.goto(`${BASE}/admin/orders`);
await admin.locator("a.font-mono").first().click();
await admin.click("button:has-text('Mark as paid')");
await admin.waitForSelector("text=PAID");
await admin.goto(`${BASE}/admin/shipments/new`);
await admin.fill("input[name=truckPlate]", "34 XYZ 789");
await admin.fill("input[name=route]", "Istanbul → Kapıkule → Sofia → Bucharest → Munich");
await Promise.all([admin.waitForURL(/\/admin\/shipments\/(?!new)/), admin.click("button:has-text('Create truck')")]);
await admin.click("button:has-text('Add to truck')");
await admin.waitForSelector("text=Orders on this truck (1)");
await admin.selectOption("select[name=stage]", "DEPARTED");
await admin.fill("input[name=location]", "Istanbul, TR");
await admin.click("button:has-text('Post update')");
await admin.waitForSelector("text=Istanbul, TR");
await admin.selectOption("select[name=stage]", "AT_BORDER");
await admin.fill("input[name=location]", "Kapıkule border");
await admin.click("button:has-text('Post update')");
await admin.waitForSelector("text=Kapıkule border");
await shot(admin, "07-admin-truck");

// Buyer sees tracking
await buyer.goto(orderUrl);
await shot(buyer, "08-buyer-tracking");
const html = await buyer.content();
ok(html.includes("34 XYZ 789") && html.includes("Kapıkule border"), "buyer sees truck and latest location");
await buyer.goto(`${orderUrl}/invoice`);
await shot(buyer, "09-invoice");
ok((await buyer.content()).includes("INVOICE"), "invoice renders");

await browser.close();
console.log("All smoke checks passed");
