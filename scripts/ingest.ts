// Change-detection pipeline (DIRECTIVE Phase 5, PRD F6).
// Source URL -> fact extraction (LLM) -> NEW/CHANGED/CONFIRMED triage vs KB
// -> JSON updates + change report + foreshadowing resurfacing detection.
//
// Copyright guardrail: the fetched article text lives in memory only.
// Only restated facts are persisted; the repo never stores source full text.
//
// Usage: pnpm ingest --url <url> --label "<label>" --tier <tier> [--file <path>]
import "./env";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  loadEntities,
  loadFacts,
  loadForeshadowing,
  loadKbMeta,
} from "../lib/kb";
import { SOURCE_TIERS, type Fact } from "../lib/schema";
import { askJson, JUDGE_CONTRACT } from "../lib/claude";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const url = arg("url");
const label = arg("label") ?? url ?? "unknown source";
const tier = (arg("tier") ?? "dev-note") as (typeof SOURCE_TIERS)[number];
const file = arg("file");

if (!url || !SOURCE_TIERS.includes(tier)) {
  console.error(
    'Usage: pnpm ingest --url <url> --label "<label>" --tier <official-site|steam-official|dev-note|official-wiki|community-wiki|press> [--file <path>]'
  );
  process.exit(1);
}

async function fetchSourceText(): Promise<string> {
  if (file) return fs.readFileSync(file, "utf-8");
  console.log(`Fetching ${url} ...`);
  const res = await fetch(url!, {
    headers: { "User-Agent": "Mozilla/5.0 (LoreGuard ingest; manual trigger)" },
  });
  if (!res.ok) throw new Error(`fetch failed: HTTP ${res.status}`);
  const html = await res.text();
  // Crude readable-text extraction; the text is used in memory only.
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ExtractionSchema = z.object({
  candidates: z.array(
    z.object({
      statement_ko: z.string(),
      statement_en: z.string(),
      claim_type: z.enum(["timeline", "relation", "attribute", "naming", "tone-canon"]),
      entity_ids: z.array(z.string()),
      classification: z.enum(["NEW", "CHANGED", "CONFIRMED"]),
      related_fact_id: z.string().nullable(),
      reason_ko: z.string(),
    })
  ),
});

const ResurfaceSchema = z.object({
  resurfaced: z.array(
    z.object({ foreshadowing_id: z.string(), reason_ko: z.string() })
  ),
});

function bumpVersion(v: string): string {
  const m = v.match(/^(\d{4}\.\d{2})(?:\.(\d+))?$/);
  if (!m) throw new Error(`bad version: ${v}`);
  return `${m[1]}.${m[2] ? Number(m[2]) + 1 : 1}`;
}

async function main() {
  const entities = loadEntities();
  const facts = loadFacts();
  const foreshadowing = loadForeshadowing();
  const meta = loadKbMeta();

  const raw = await fetchSourceText();
  const text = raw.slice(0, 9000);
  console.log(`Source text: ${text.length} chars (in-memory only)`);

  const prevVersion = meta.kb_version;
  const newVersion = bumpVersion(prevVersion);
  const today = new Date().toISOString().slice(0, 10);

  // ---- 1) extraction + triage in one judgment ----------------------------
  const entityList = entities
    .map((e) => `${e.id} = ${e.name_ko} (${e.name_en})`)
    .join("\n");
  const factList = facts
    .filter((f) => f.claim_type !== "naming")
    .map((f) => `${f.id} [${f.claim_type}/${f.status}] ${f.statement_ko}`)
    .join("\n");

  const extraction = await askJson({
    system: `너는 게임 세계관 지식베이스의 수집 파이프라인이다. 소스 텍스트에서 세계관·게임에 관한 사실을 추출하고 기존 지식베이스와 대조 분류한다.\n${JUDGE_CONTRACT}`,
    user: `## 소스 텍스트 (${label}, 티어: ${tier})
"""
${text}
"""

## 기존 엔티티 목록 (entity_ids는 반드시 이 목록의 ID만 사용)
${entityList}

## 기존 팩트 목록
${factList}

## 지시
1. 소스에서 세계관·게임 개발에 관한 의미 있는 사실을 추출하라 (최대 10건, 광고·기자 의견 제외).
2. 각 사실을 **저작권 원칙에 따라 원문을 인용하지 말고 자체 문장으로 재기술**하라 (한/영).
3. 각 사실을 기존 팩트와 대조해 분류하라:
   - NEW: 기존에 없던 사실 (related_fact_id: null)
   - CHANGED: 기존 팩트와 충돌·대체 (related_fact_id: 대체되는 기존 팩트 ID)
   - CONFIRMED: 기존 팩트를 재확인 (related_fact_id: 해당 팩트 ID)
4. 관련 엔티티가 목록에 없으면 entity_ids에 가장 가까운 상위 개념(예: ENT-CHRONO-ODYSSEY)을 사용하라.

출력 JSON: {"candidates":[{"statement_ko":"...","statement_en":"...","claim_type":"timeline|relation|attribute|naming|tone-canon","entity_ids":["ENT-.."],"classification":"NEW|CHANGED|CONFIRMED","related_fact_id":"FACT-.. 또는 null","reason_ko":"분류 근거"}]}`,
    schema: ExtractionSchema,
    maxTokens: 4000,
  });

  console.log(`Extracted ${extraction.candidates.length} candidate fact(s)`);

  // ---- 2) apply to KB ----------------------------------------------------
  const factById = new Map(facts.map((f) => [f.id, f]));
  const entityIds = new Set(entities.map((e) => e.id));
  let nextNum =
    Math.max(...facts.map((f) => Number(f.id.slice(5)))) + 1;

  const newFactIds: string[] = [];
  const changed: { old_id: string; new_id: string }[] = [];
  const confirmedIds: string[] = [];

  for (const c of extraction.candidates) {
    const validEntityIds = c.entity_ids.filter((id) => entityIds.has(id));
    if (validEntityIds.length === 0) validEntityIds.push("ENT-CHRONO-ODYSSEY");

    if (c.classification === "CONFIRMED") {
      const target = c.related_fact_id ? factById.get(c.related_fact_id) : undefined;
      if (target) {
        if (!target.sources.some((s) => s.url === url)) {
          target.sources.push({ url: url!, source_tier: tier, captured_at: today });
          const officialTiers = ["official-site", "steam-official", "dev-note", "official-wiki"];
          const officialCount = target.sources.filter((s) =>
            officialTiers.includes(s.source_tier)
          ).length;
          if (officialCount >= 2) target.confidence = "confirmed";
          else if (target.confidence === "speculative") target.confidence = "probable";
        }
        confirmedIds.push(target.id);
        continue;
      }
    }

    const id = `FACT-${String(nextNum++).padStart(4, "0")}`;
    const newFact: Fact = {
      id,
      entity_ids: validEntityIds,
      claim_type: c.claim_type,
      statement_ko: c.statement_ko,
      statement_en: c.statement_en,
      sources: [{ url: url!, source_tier: tier, captured_at: today }],
      status: "active",
      superseded_by: null,
      confidence: "probable",
      first_seen_kb_version: newVersion,
      notes: `Ingested ${today}: ${c.reason_ko}`,
    };
    facts.push(newFact);
    factById.set(id, newFact);

    if (c.classification === "CHANGED" && c.related_fact_id) {
      const old = factById.get(c.related_fact_id);
      if (old && old.id !== id) {
        old.status = "superseded";
        old.superseded_by = id;
        changed.push({ old_id: old.id, new_id: id });
        continue;
      }
    }
    newFactIds.push(id);
  }

  // ---- 3) foreshadowing resurfacing --------------------------------------
  const openForeshadowing = foreshadowing.filter(
    (f) => f.status === "unresolved" || f.status === "resurfaced"
  );
  const resurface = await askJson({
    system: `너는 복선 원장 관리자다. 신규 텍스트가 기존 미해소 복선과 의미적으로 연결되는지(재부상) 판정한다.\n${JUDGE_CONTRACT}`,
    user: `## 신규 소스 요약 (추출된 사실들)
${extraction.candidates.map((c) => `- ${c.statement_ko}`).join("\n")}

## 미해소 복선 목록
${openForeshadowing.map((f) => `${f.id}: ${f.title_ko}: ${f.summary_ko}`).join("\n")}

신규 소스가 실질적으로 다시 언급하거나 진전시키는 복선만 보고하라. 막연한 연상은 제외한다.
출력 JSON: {"resurfaced":[{"foreshadowing_id":"FS-...","reason_ko":"..."}]}
없으면 빈 배열.`,
    schema: ResurfaceSchema,
  });

  const resurfacedIds: string[] = [];
  for (const r of resurface.resurfaced) {
    const item = foreshadowing.find((f) => f.id === r.foreshadowing_id);
    if (!item) continue;
    if (!item.history.some((h) => h.source_url === url)) {
      item.status = "resurfaced";
      item.history.push({
        date: today,
        event: `재부상, ${label}: ${r.reason_ko}`,
        source_url: url,
      });
      resurfacedIds.push(item.id);
    }
  }

  // ---- 4) meta + outputs --------------------------------------------------
  meta.kb_version = newVersion;
  meta.updated_at = today;
  if (!meta.source_registry.some((s) => s.url === url)) {
    meta.source_registry.push({
      id: `ingest-${newVersion}`,
      label,
      url: url!,
      tier,
      registered_at: today,
    });
  }

  const dataDir = path.join(process.cwd(), "data");
  const write = (name: string, value: unknown) =>
    fs.writeFileSync(
      path.join(dataDir, name),
      JSON.stringify(value, null, 2) + "\n",
      "utf-8"
    );
  write("facts.json", facts);
  write("foreshadowing.json", foreshadowing);
  write("kb-meta.json", meta);

  const summary_ko = `${label} 유입: 신규 ${newFactIds.length}건, 변경 ${changed.length}건, 재확인 ${confirmedIds.length}건, 재부상 복선 ${resurfacedIds.length}건. KB ${meta.kb_version}.`;
  const changeReport = {
    kb_version: newVersion,
    previous_version: prevVersion,
    source: { url: url!, label, tier },
    created_at: new Date().toISOString(),
    summary_ko,
    new_fact_ids: newFactIds,
    changed,
    confirmed_fact_ids: confirmedIds,
    resurfaced_foreshadowing_ids: resurfacedIds,
  };
  write(path.join("reports", `change-${newVersion}.json`), changeReport);

  const md = [
    `# 변경 감지 리포트, KB ${newVersion}`,
    ``,
    `- 소스: [${label}](${url}) (${tier})`,
    `- 생성: ${new Date().toISOString()}`,
    ``,
    `## 요약`,
    summary_ko,
    ``,
    `## NEW (${newFactIds.length})`,
    ...newFactIds.map((id) => `- ${id}: ${factById.get(id)?.statement_ko}`),
    ``,
    `## CHANGED (${changed.length})`,
    ...changed.map(
      (c) =>
        `- ${c.old_id} → ${c.new_id}: ${factById.get(c.new_id)?.statement_ko}`
    ),
    ``,
    `## CONFIRMED (${confirmedIds.length})`,
    ...confirmedIds.map((id) => `- ${id}: ${factById.get(id)?.statement_ko}`),
    ``,
    `## 재부상한 복선 (${resurfacedIds.length})`,
    ...resurfacedIds.map((id) => {
      const f = foreshadowing.find((x) => x.id === id);
      return `- ${id}: ${f?.title_ko}`;
    }),
    ``,
  ].join("\n");
  fs.writeFileSync(
    path.join(dataDir, "reports", `change-${newVersion}.md`),
    md,
    "utf-8"
  );

  console.log("");
  console.log(summary_ko);
  console.log(`Change report -> data/reports/change-${newVersion}.{json,md}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
