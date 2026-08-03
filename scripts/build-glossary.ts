// Glossary builder — derives data/glossary.json from naming facts (DIRECTIVE Phase 3).
// Conflicted spellings are kept side by side and flagged, never hidden.
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { loadEntities, loadFacts } from "../lib/kb";
import { GlossaryEntrySchema, SOURCE_TIERS, type GlossaryEntry } from "../lib/schema";

const TIER_RANK = new Map(SOURCE_TIERS.map((t, i) => [t, i]));

const entities = loadEntities();
const facts = loadFacts();

const entries: GlossaryEntry[] = [];

for (const e of entities) {
  const namingFacts = facts.filter(
    (f) => f.claim_type === "naming" && f.entity_ids.includes(e.id)
  );
  if (namingFacts.length === 0) continue;

  // Best source = highest tier across the entity's naming facts
  const best = namingFacts
    .flatMap((f) => f.sources.map((s) => ({ fact: f, source: s })))
    .sort(
      (a, b) =>
        (TIER_RANK.get(a.source.source_tier) ?? 99) -
        (TIER_RANK.get(b.source.source_tier) ?? 99)
    )[0];

  const conflict = namingFacts.filter((f) => f.status === "conflicted").length >= 2;
  const deprecated = namingFacts.every((f) => f.status === "deprecated");

  const definition = e.summary_ko.split(/(?<=다\.)\s/)[0];

  entries.push({
    entity_id: e.id,
    ko: e.name_ko,
    en: e.name_en,
    variants: e.aliases,
    type: e.type,
    definition_ko: definition,
    source_url: best.source.url,
    confidence: best.fact.confidence,
    status: conflict ? "conflicted" : deprecated ? "deprecated" : best.fact.status,
    conflict,
  });
}

entries.sort((a, b) => a.type.localeCompare(b.type) || a.ko.localeCompare(b.ko, "ko"));

const parsed = z.array(GlossaryEntrySchema).safeParse(entries);
if (!parsed.success) {
  console.error("Glossary validation failed:", parsed.error.issues);
  process.exit(1);
}

const outFile = path.join(process.cwd(), "data", "glossary.json");
fs.writeFileSync(outFile, JSON.stringify(entries, null, 2) + "\n", "utf-8");
console.log(
  `Glossary: ${entries.length} entries (${entries.filter((e) => e.conflict).length} conflicted) -> ${outFile}`
);
