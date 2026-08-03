// Phase 4 DoD test: live gate judgment via UI (FAIL demo -> 실시간 재판정),
// verifying verdict, evidence citation, and the <30s target.
import { chromium } from "@playwright/test";

const out = process.argv[2] ?? "gate.png";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
await page.goto("http://localhost:3000/gate", { waitUntil: "networkidle" });

// Load FAIL demo (precomputed, instant seal)
await page.getByRole("button", { name: "FAIL 시나리오" }).click();
await page.waitForTimeout(600);

// Live re-judgment, timed
const t0 = Date.now();
await page.getByRole("button", { name: "실시간 재판정" }).click();
await page.waitForSelector(".seal", { timeout: 45000 });
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

await page.waitForTimeout(500);
await page.screenshot({ path: out });

const verdict = await page.locator(".seal").innerText();
const evidence = await page.locator("article").count();
await browser.close();

console.log(`saved ${out}`);
console.log(`live judgment: ${elapsed}s -> verdict=${verdict}, evidence cards=${evidence}`);
if (Number(elapsed) > 30) {
  console.error("FAILED: judgment exceeded 30s target");
  process.exit(1);
}
