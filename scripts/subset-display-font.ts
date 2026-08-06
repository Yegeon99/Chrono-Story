// Builds the self-hosted Gowun Batang subset used by the display face.
//
// Why: the Google-hosted family ships Hangul as ~10 unnamed unicode-range
// chunks. The home screen pulled 11 woff2 files / ~200KB for the handful of
// words that actually render in the display face (chapter titles, page and
// section headings, nav group labels, the verdict seal, numeric readouts).
// Subsetting to the glyphs those slots can ever contain collapses that to one
// file per weight.
//
// The glyph set is derived, not hand-listed, from every string that can reach
// a display-face slot:
//   - literals in app/**/*.tsx and components/**/*.tsx (page + section headings,
//     nav labels, seal text, static headings; over-inclusive by design since it
//     also sweeps comments and prop strings)
//   - entities.json name_ko / name_en / aliases  (knowledge heading, lore popover)
//   - foreshadowing.json title_ko                (ledger detail heading)
//   - `title:` fields in lib/chronicle.ts and lib/intro-path.ts
// Over-inclusion is safe (a few unused outlines); under-inclusion is not — a
// missing glyph silently falls back to Batang/serif mid-heading.
//
// Sources are fetched from the upstream OFL release and cached outside the
// repo; only the subsets and the license are committed.
// Run: pnpm subset-font   (then rebuild — next/font/local picks the files up)
import fs from "node:fs";
import path from "node:path";
import subsetFont from "subset-font";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "app", "fonts");
const CACHE_DIR = path.join(ROOT, "node_modules", ".cache", "gowun-batang");

const UPSTREAM =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/gowunbatang";
// A DOM sweep over every route (including the seal states, the intro path and
// each ledger card) found exactly one glyph rendering at weight 400: the "?"
// in the empty stamp bed. Everything else in the display face is bold. So 400
// carries the Latin/punctuation core only. If Korean display text at 400 ever
// appears, CSS font matching pulls those glyphs from the 700 face of the same
// family rather than dropping to the serif fallback.
const WEIGHTS = [
  {
    weight: 400,
    file: "GowunBatang-Regular.ttf",
    out: "gowun-batang-400.woff2",
    latinOnly: true,
  },
  {
    weight: 700,
    file: "GowunBatang-Bold.ttf",
    out: "gowun-batang-700.woff2",
    latinOnly: false,
  },
];

// Always keep these regardless of what the scan finds: the Latin/digit core the
// seal and the numeric readouts depend on, plus the punctuation the layout
// leans on (middot separators, em dashes, arrows, status marks).
const ALWAYS = [
  " !\"#$%&'()*+,-./0123456789:;<=>?@",
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`",
  "abcdefghijklmnopqrstuvwxyz{|}~",
  "·—–…‘’“”「」『』〈〉《》→←↑↓✓⚠◆●○×°※",
].join("");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(p);
  }
  return out;
}

function collectGlyphs(): string {
  const chars = new Set<string>();
  const add = (s: string) => {
    for (const c of s) if (c.codePointAt(0)! > 0x1f) chars.add(c);
  };

  add(ALWAYS);

  for (const file of [...walk(path.join(ROOT, "app")), ...walk(path.join(ROOT, "components"))]) {
    add(fs.readFileSync(file, "utf-8"));
  }

  const entities = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "entities.json"), "utf-8")
  ) as { name_ko: string; name_en: string; aliases: string[] }[];
  for (const e of entities) {
    add(e.name_ko);
    add(e.name_en);
    e.aliases.forEach(add);
  }

  const foreshadowing = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "foreshadowing.json"), "utf-8")
  ) as { title_ko: string }[];
  for (const f of foreshadowing) add(f.title_ko);

  // Only the `title:` fields — chapter bodies and step descriptions render in
  // the sans face and would drag hundreds of unused outlines into the subset.
  for (const lib of ["chronicle.ts", "intro-path.ts"]) {
    const src = fs.readFileSync(path.join(ROOT, "lib", lib), "utf-8");
    for (const m of src.match(/title:\s*"[^"]+"/g) ?? []) add(m);
  }

  return [...chars].sort().join("");
}

async function source(file: string): Promise<Buffer> {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cached = path.join(CACHE_DIR, file);
  if (fs.existsSync(cached)) return fs.readFileSync(cached);
  const res = await fetch(`${UPSTREAM}/${file}`);
  if (!res.ok) throw new Error(`${file}: upstream returned ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(cached, buf);
  return buf;
}

async function main() {
  const glyphs = collectGlyphs();
  const hangul = [...glyphs].filter((c) => /[가-힣]/.test(c)).length;
  console.log(`glyph set: ${[...glyphs].length} chars (${hangul} Hangul syllables)`);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const licensePath = path.join(OUT_DIR, "OFL.txt");
  if (!fs.existsSync(licensePath)) {
    const res = await fetch(`${UPSTREAM}/OFL.txt`);
    if (!res.ok) throw new Error(`OFL.txt: upstream returned ${res.status}`);
    fs.writeFileSync(licensePath, await res.text());
    console.log("  fetched OFL.txt");
  }

  let total = 0;
  for (const { weight, file, out, latinOnly } of WEIGHTS) {
    const ttf = await source(file);
    const set = latinOnly ? ALWAYS : glyphs;
    const woff2 = await subsetFont(ttf, set, { targetFormat: "woff2" });
    fs.writeFileSync(path.join(OUT_DIR, out), woff2);
    total += woff2.length;
    console.log(
      `  ${weight}${latinOnly ? " (latin only)" : ""}: ${(ttf.length / 1024).toFixed(0)}KB ttf -> ` +
        `${(woff2.length / 1024).toFixed(1)}KB woff2  (${out})`
    );
  }
  console.log(`total subset: ${(total / 1024).toFixed(1)}KB`);
}

main();
