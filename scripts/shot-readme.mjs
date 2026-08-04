// Captures the three README hero scenes against a running production server
// (pnpm build && pnpm start), saving into docs/screenshots/.
//   1. chronicle with a term popover open
//   2. verification gate stamping a FAIL seal
//   3. QA dashboard: change detection + source-honesty gauge
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "docs", "screenshots");
fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1.5,
});

// 1 — chronicle term popover
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "크로노스", exact: true }).first().click();
await page.getByRole("dialog", { name: "크로노스 정의" }).waitFor();
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT_DIR, "chronicle-popover.png") });

// 2 — gate FAIL seal
await page.goto(BASE + "/gate", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "FAIL 시나리오" }).click();
await page.locator(".seal").waitFor();
await page.waitForTimeout(600); // let the stamp animation settle
await page.screenshot({ path: path.join(OUT_DIR, "gate-fail-seal.png") });

// 3 — QA dashboard (change detection + confidence gauge)
await page.goto(BASE + "/dashboard", { waitUntil: "networkidle" });
await page.getByText("출처 정직성 지표").first().scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT_DIR, "dashboard-change.png") });

await browser.close();
console.log("saved 3 screenshots -> docs/screenshots/");
