// Phase 1 gate screenshot: knowledge explorer with the conflicted entity open.
import { chromium } from "@playwright/test";

const out = process.argv[2] ?? "knowledge.png";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000/knowledge", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /에셀드레나/ }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: out });
await browser.close();
console.log("saved " + out);
