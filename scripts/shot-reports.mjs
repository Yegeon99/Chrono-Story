// Phase 2 gate screenshot: reports page with the naming-conflict finding expanded.
import { chromium } from "@playwright/test";

const out = process.argv[2] ?? "reports.png";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
await page.goto("http://localhost:3000/reports", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Etheldreda/ }).first().click();
await page.waitForTimeout(400);
await page.screenshot({ path: out });
await browser.close();
console.log("saved " + out);
