// Generates public/og.png (1200x630) from design-system tokens only,
// no game art (DIRECTIVE §0.4). Renders an inline HTML card with the
// archive-seal sigil and screenshots it via Playwright.
import { chromium } from "@playwright/test";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "og.png");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
<style>
  :root {
    --ink-950: #0C0E13;
    --ink-900: #12151D;
    --ink-700: #232838;
    --parchment: #E8E2D4;
    --parchment-dim: #9A958A;
    --gilt: #C9A227;
  }
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px;
    background:
      radial-gradient(1100px 620px at 24% 18%, rgba(201,162,39,0.07), transparent 60%),
      radial-gradient(900px 700px at 88% 108%, rgba(62,124,138,0.10), transparent 55%),
      var(--ink-950);
    color: var(--parchment);
    font-family: "Gowun Batang", serif;
    display: flex; align-items: center;
    overflow: hidden; position: relative;
  }
  /* archive rule frame */
  .frame {
    position: absolute; inset: 26px;
    border: 1px solid rgba(201,162,39,0.28);
    outline: 1px solid rgba(201,162,39,0.10);
    outline-offset: 5px;
    pointer-events: none;
  }
  .card { display: flex; align-items: center; gap: 72px; padding: 0 110px; width: 100%; }
  .sigil { flex-shrink: 0; }
  h1 { font-size: 92px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.08; }
  .eyebrow {
    font-family: "JetBrains Mono", monospace;
    font-size: 21px; font-weight: 500; letter-spacing: 0.32em;
    color: var(--gilt); margin-bottom: 26px;
  }
  .sub { font-size: 33px; color: var(--parchment-dim); margin-top: 26px; letter-spacing: 0.01em; }
  .rule { margin-top: 34px; width: 430px; border-top: 1px solid var(--gilt); position: relative; }
  .rule::after { content: ""; position: absolute; left: 0; right: 96px; top: 3px; border-top: 1px solid rgba(201,162,39,0.4); }
  .foot {
    position: absolute; left: 110px; right: 110px; bottom: 56px;
    display: flex; justify-content: space-between; align-items: baseline;
    font-family: "JetBrains Mono", monospace;
    font-size: 17px; letter-spacing: 0.14em; color: var(--parchment-dim);
  }
</style>
</head>
<body>
  <div class="frame"></div>
  <div class="card">
    <svg class="sigil" viewBox="0 0 24 24" width="240" height="240" fill="none"
         stroke="#C9A227" stroke-width="0.9" stroke-linejoin="round">
      <path d="M12 1.6 22.4 12 12 22.4 1.6 12Z" />
      <path d="M12 3.4 20.6 12 12 20.6 3.4 12Z" stroke-opacity="0.45" stroke-width="0.5" />
      <path d="M8.6 7.2h6.8M8.6 16.8h6.8" />
      <path d="M9.3 7.2v1.4c0 1.2 2.7 2.2 2.7 3.4s-2.7 2.2-2.7 3.4v1.4" />
      <path d="M14.7 7.2v1.4c0 1.2-2.7 2.2-2.7 3.4s2.7 2.2 2.7 3.4v1.4" />
    </svg>
    <div>
      <div class="eyebrow">NARRATIVE CI · CHRONO ODYSSEY</div>
      <h1>Lore Guard</h1>
      <div class="sub">세계관 정합성 · 용어 일관성 QA 에이전트</div>
      <div class="rule"></div>
    </div>
  </div>
  <div class="foot">
    <span>ENTITY · FACT · RELATION · SOURCE</span>
    <span>비공식 팬 포트폴리오</span>
  </div>
</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
await page.screenshot({ path: OUT });
await browser.close();
console.log("saved " + OUT);
