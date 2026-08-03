// Ad-hoc screenshot helper for phase-gate reports.
import { chromium } from "@playwright/test";

const [, , url = "http://localhost:3000/", out = "shot.png"] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log("saved " + out);
