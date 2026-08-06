// Re-encodes the chronicle chapter illustrations in place under a size budget.
//
// The chronicle renders these full-bleed at max-w-4xl (896 CSS px), so anything
// past ~1792 physical px is wasted even on a 2x display — and mobile is the
// screen that actually pays for the bytes. next/image derives its AVIF/WebP
// variants from these files, so a smaller, cleaner source shrinks every variant.
// Quality steps down (and, as a last resort, width) until the file fits BUDGET.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const DIR = path.join(process.cwd(), "public", "chronicle");
const BUDGET = 200 * 1024;
const WIDTHS = [1792, 1600, 1440];
const QUALITIES = [78, 72, 66, 60, 54, 48];

const files = fs.readdirSync(DIR).filter((f) => /\.jpe?g$/i.test(f)).sort();
let totalBefore = 0;
let totalAfter = 0;

async function main() {
for (const file of files) {
  const full = path.join(DIR, file);
  const before = fs.statSync(full).size;
  const input = fs.readFileSync(full);
  const meta = await sharp(input).metadata();

  let best: Buffer | null = null;
  let chosen = "";

  outer: for (const width of WIDTHS) {
    for (const quality of QUALITIES) {
      const buf = await sharp(input)
        .resize({ width: Math.min(width, meta.width ?? width), withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true, chromaSubsampling: "4:2:0" })
        .toBuffer();
      if (buf.length <= BUDGET) {
        best = buf;
        chosen = `${Math.min(width, meta.width ?? width)}px q${quality}`;
        break outer;
      }
      best = buf;
      chosen = `${Math.min(width, meta.width ?? width)}px q${quality}`;
    }
  }

  if (!best) throw new Error(`${file}: no encode produced`);
  fs.writeFileSync(full, best);
  totalBefore += before;
  totalAfter += best.length;
  const flag = best.length <= BUDGET ? "" : "  (OVER BUDGET)";
  console.log(
    `${file}: ${(before / 1024).toFixed(0)}KB -> ${(best.length / 1024).toFixed(0)}KB  [${chosen}]${flag}`
  );
}

console.log(
  `total ${(totalBefore / 1024).toFixed(0)}KB -> ${(totalAfter / 1024).toFixed(0)}KB across ${files.length} files (budget ${BUDGET / 1024}KB each)`
);
}

main();
