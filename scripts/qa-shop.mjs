import { chromium } from "playwright";
import { mkdirSync } from "fs";
mkdirSync("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE", m.text());
});

await page.goto("http://127.0.0.1:8080/s/NOTASHOP", { waitUntil: "networkidle" });
const missing = await page.locator("body").innerText();
console.log("JOIN_MISSING", missing.includes("not a shop") || missing.includes("not valid") ? "ok" : missing.slice(0, 200));
await page.screenshot({ path: "/workspace/screenshots/join-missing.png" });

const email = `owner${Date.now()}@shop.co.ke`;
await page.goto("http://127.0.0.1:8080/login", { waitUntil: "networkidle" });
await page.getByPlaceholder("Wanjiru").fill("Wanjiru");
await page.getByPlaceholder("you@shop.co.ke").fill(email);
await page.getByPlaceholder("At least 8 characters").fill("password123");
await page.getByRole("button", { name: "Create shop" }).click();
await page.waitForURL("**/app**", { timeout: 20000 });
await page.waitForTimeout(1500);
console.log("APP_URL", page.url());
await page.screenshot({ path: "/workspace/screenshots/today-after-signup.png" });

await page.goto("http://127.0.0.1:8080/app/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const shopText = await page.locator("body").innerText();
console.log("SHOP_HAS_QR", shopText.includes("Counter QR"));
console.log("SHOP_HAS_PLAN", shopText.includes("Plan"));
console.log("SHOP_HAS_STAFF", shopText.includes("Staff"));
console.log("SHOP_SNIP", shopText.slice(0, 500));
await page.screenshot({ path: "/workspace/screenshots/shop-desk.png" });

const link = await page.locator("p.break-all").first().innerText().catch(() => "");
console.log("JOIN_URL", link);
const invite = await page.locator(".font-display.text-2xl").first().innerText().catch(() => "");
console.log("INVITE", invite);

if (link.includes("/s/")) {
  const joinPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await joinPage.goto(link.replace("http://localhost:8080", "http://127.0.0.1:8080"), { waitUntil: "networkidle" });
  await joinPage.waitForTimeout(800);
  const jt = await joinPage.locator("body").innerText();
  console.log("JOIN_FORM", jt.slice(0, 300));
  await joinPage.screenshot({ path: "/workspace/screenshots/join-form.png" });
  if (jt.includes("Leave your number") || jt.includes("name")) {
    await joinPage.locator("input").nth(0).fill("Mercy Achieng");
    await joinPage.locator("input").nth(1).fill("0712340099");
    await joinPage.locator("textarea").fill("Brown satchel");
    await joinPage.getByRole("button", { name: "Send to the shop" }).click();
    await joinPage.waitForTimeout(1500);
    const done = await joinPage.locator("body").innerText();
    console.log("JOIN_DONE", done.slice(0, 250));
    await joinPage.screenshot({ path: "/workspace/screenshots/join-done.png" });
  }
  await joinPage.close();
}

await page.goto("http://127.0.0.1:8080/app", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const today = await page.locator("body").innerText();
console.log("TODAY_HAS_MERCY", today.includes("Mercy"));
console.log("TODAY_SNIP", today.slice(0, 400));
await page.screenshot({ path: "/workspace/screenshots/today-qr-person.png" });

await browser.close();
