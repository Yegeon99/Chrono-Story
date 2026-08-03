// Phase 3 gate: screenshot glossary + verify CSV download content.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const [, , shotPath = "glossary.png", csvPath = "glossary-download.csv"] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
await page.goto("http://localhost:3000/glossary", { waitUntil: "networkidle" });

const downloadPromise = page.waitForEvent("download");
await page.getByRole("button", { name: "CSV 내보내기" }).click();
const download = await downloadPromise;
await download.saveAs(csvPath);

await page.screenshot({ path: shotPath });
await browser.close();

const csv = fs.readFileSync(csvPath, "utf-8");
const lines = csv.split("\r\n");
console.log("saved " + shotPath);
console.log(`CSV: ${lines.length - 1} data rows, BOM=${csv.charCodeAt(0) === 0xfeff}`);
console.log("header: " + lines[0].replace(/^﻿/, ""));
console.log("sample: " + lines.find((l) => l.includes("Etheldrena")));
