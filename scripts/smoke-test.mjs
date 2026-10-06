// End-to-end smoke test of the main flows.
// Run with the app on :3000 (or BASE_URL): node scripts/smoke-test.mjs [screenshotDir]
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const shots = process.argv[2];
const exe = process.env.CHROMIUM_PATH;
const browser = await chromium.launch({
  ...(exe ? { executablePath: exe } : {}),
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const errors = [];
const shot = async (page, name) => shots && page.screenshot({ path: `${shots}/${name}.png` });
const ok = (cond, msg) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`✓ ${msg}`);
};

async function newPage() {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  return page;
}

async function login(email, password) {
  const page = await newPage();
  await page.goto(`${BASE}/login`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/login")), page.click("form button:has-text('Log in')")]);
  return page;
}

// Guest: catalog visible, prices hidden
const guest = await newPage();
await guest.goto(`${BASE}/catalog`, { waitUntil: "networkidle" });
ok((await guest.content()).includes("Trade price"), "guest sees the collection without prices");

// Buyer: add to load, check out on a shared truck with a deposit
const buyer = await login("buyer@example.com", "buyer12345");
await buyer.goto(`${BASE}/products/milano-sofa-bed-sb-190`, { waitUntil: "networkidle" });
await buyer.fill("input[name=quantity]", "12");
await buyer.click("button:has-text('Add & review load')");
await buyer.waitForURL(/\/cart/, { waitUntil: "commit" });
await buyer.waitForSelector("text=Your");
await shot(buyer, "cart");
ok((await buyer.content()).includes("€4,428.00"), "volume tier applied (12 × €369)");
await buyer.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
await buyer.click("button:has-text('Place order')");
await buyer.waitForURL(/\/orders\/.+placed=1/, { timeout: 30000 });
await shot(buyer, "order-placed");
const orderUrl = buyer.url().split("?")[0];
const html = await buyer.content();
ok(html.includes("deposit to start production"), "deposit requested before production");
ok(html.includes("reverse charge"), "DE buyer with VAT ID is reverse-charged");
ok(html.includes("TIR-2026-002"), "order booked on the chosen shared truck");

// Admin: record the deposit and move the truck
const admin = await login("admin@example.com", "admin12345");
await admin.goto(`${BASE}/admin/orders`);
await admin.locator("a.font-mono").first().click();
await admin.waitForURL(/\/admin\/orders\/.+/);
await admin.click("button:has-text('Deposit received')");
await admin.waitForSelector("text=Deposit paid");
ok(true, "admin records the deposit");
await admin.click("a:has-text('TIR-2026-002')");
await admin.waitForURL(/\/admin\/shipments\/.+/);
for (const [stage, location] of [["LOADING", "Inegöl workshop"], ["DEPARTED", "Hadımköy gate"], ["AT_BORDER", "Kapıkule border"]]) {
  await admin.selectOption("select[name=stage]", stage);
  await admin.fill("input[name=location]", location);
  await admin.click("button:has-text('Post update')");
  await admin.waitForSelector(`li:has-text("${location}")`);
  await admin.waitForLoadState("networkidle");
}
await shot(admin, "admin-truck");
ok(true, "admin posts truck updates");

// Buyer follows the truck
await buyer.goto(orderUrl, { waitUntil: "networkidle" });
await buyer.waitForTimeout(2500);
await shot(buyer, "tracking");
const tracking = await buyer.content();
ok(tracking.includes("16 KLM 482") && tracking.includes("Kapıkule border"), "buyer sees the truck plate and latest location");
ok(tracking.includes("Balance"), "balance shown as due before loading");
await buyer.goto(`${orderUrl}/invoice`);
ok((await buyer.content()).includes("PROFORMA"), "proforma invoice renders");

await browser.close();
if (errors.length) {
  console.error("Page errors:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("All smoke checks passed");
