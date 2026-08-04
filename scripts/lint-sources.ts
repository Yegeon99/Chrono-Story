// Source hygiene linter — static checks on fact sources (no LLM, CI-safe).
// Enforces the honesty contract behind confidence levels:
//   - every source URL is https and its host is registered in kb-meta.json
//   - the tier stamped on a fact source matches the registry tier for that host
//   - "confirmed" requires >=2 official-family sources with distinct URLs
//     (same contract as the ingest CONFIRMED path in scripts/ingest.ts)
// Non-zero exit on any violation.
import { loadFacts, loadKbMeta } from "../lib/kb";

const OFFICIAL_TIERS = new Set([
  "official-site",
  "steam-official",
  "dev-note",
  "official-wiki",
]);

const facts = loadFacts();
const meta = loadKbMeta();

const registryTierByHost = new Map<string, string>(
  meta.source_registry.map((s) => [new URL(s.url).hostname, s.tier])
);

const errors: string[] = [];
// Local calendar date — toISOString() is UTC and flags same-day KST captures.
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

for (const fact of facts) {
  const seenUrls = new Set<string>();

  for (const src of fact.sources) {
    const url = new URL(src.url);

    if (url.protocol !== "https:") {
      errors.push(`${fact.id}: non-https source ${src.url}`);
    }

    if (seenUrls.has(src.url)) {
      errors.push(`${fact.id}: duplicate source URL ${src.url}`);
    }
    seenUrls.add(src.url);

    const registeredTier = registryTierByHost.get(url.hostname);
    if (!registeredTier) {
      errors.push(
        `${fact.id}: host ${url.hostname} is not in the kb-meta source registry`
      );
    } else if (registeredTier !== src.source_tier) {
      errors.push(
        `${fact.id}: tier "${src.source_tier}" for ${url.hostname} contradicts registry tier "${registeredTier}"`
      );
    }

    if (src.captured_at > today) {
      errors.push(`${fact.id}: captured_at ${src.captured_at} is in the future`);
    }
  }

  if (fact.confidence === "confirmed") {
    const officialUrls = new Set(
      fact.sources
        .filter((s) => OFFICIAL_TIERS.has(s.source_tier))
        .map((s) => s.url)
    );
    if (officialUrls.size < 2) {
      errors.push(
        `${fact.id}: confidence "confirmed" requires >=2 distinct official-family ` +
          `source URLs (found ${officialUrls.size})`
      );
    }
  }
}

if (errors.length > 0) {
  console.error(`Source lint failed (${errors.length} violation(s)):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}

console.log(
  `Source lint OK — ${facts.length} facts, ${registryTierByHost.size} registered hosts`
);
