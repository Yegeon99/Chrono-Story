// Consistency check engine — C1..C5 (DIRECTIVE Phase 2).
// Rule-based candidate selection first, LLM judgment second (cost control).
// Results are written to data/reports/<kb_version>.json and cached per KB version.
//
// Usage: pnpm check [--force]
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
import { ToneCanonSchema, type CheckReport, type Fact } from "../lib/schema";
import { askJson, JUDGE_CONTRACT } from "../lib/claude";

const FindingSchema = z.object({
  severity: z.enum(["critical", "warning", "info"]),
  fact_ids: z.array(z.string()),
  verdict_ko: z.string(),
  evidence_ko: z.string(),
  recommendation_ko: z.string(),
});
type Finding = z.infer<typeof FindingSchema>;
const FindingsSchema = z.object({ findings: z.array(FindingSchema) });

const meta = loadKbMeta();
const entities = loadEntities();
const facts = loadFacts();
const foreshadowing = loadForeshadowing();
const toneCanon = ToneCanonSchema.parse(
  JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "tone-canon.json"), "utf-8"))
);

const REPORTS_DIR = path.join(process.cwd(), "data", "reports");
const outFile = path.join(REPORTS_DIR, `${meta.kb_version}.json`);
const force = process.argv.includes("--force");

// Fail fast before writing anything: a keyless run would cache a report full of
// parse-errors for this KB version and silently mask the real check results.
if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    "ANTHROPIC_API_KEY is not set — aborting without writing a report. Add it to .env.local."
  );
  process.exit(1);
}

if (fs.existsSync(outFile) && !force) {
  console.log(`Cached report for KB ${meta.kb_version} exists (${outFile}). Use --force to re-run.`);
  process.exit(0);
}

const entityById = new Map(entities.map((e) => [e.id, e]));
const factById = new Map(facts.map((f) => [f.id, f]));

function compactFact(f: Fact): string {
  const names = f.entity_ids
    .map((id) => entityById.get(id)?.name_ko ?? id)
    .join(", ");
  return `${f.id} [${f.claim_type}/${f.status}/${f.confidence}] (${names}) ${f.statement_ko}`;
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

// ---------------------------------------------------------------------------
// C3 — naming consistency: rule-based candidates -> LLM same-subject judgment
// ---------------------------------------------------------------------------
async function runC3(): Promise<Finding[]> {
  type Candidate = { entity_id: string; variants: string[]; fact_ids: string[] };
  const candidates: Candidate[] = [];

  for (const e of entities) {
    // (a) alias close to canonical name -> spelling variant candidate
    const variantAliases = e.aliases.filter(
      (a) => a !== e.name_en && levenshtein(a, e.name_en) > 0 && levenshtein(a, e.name_en) <= 2
    );
    // (b) conflicted naming facts on this entity
    const conflictedNaming = facts.filter(
      (f) => f.claim_type === "naming" && f.status === "conflicted" && f.entity_ids.includes(e.id)
    );
    if (variantAliases.length > 0 || conflictedNaming.length >= 2) {
      candidates.push({
        entity_id: e.id,
        variants: [e.name_en, ...e.aliases],
        fact_ids: conflictedNaming.map((f) => f.id),
      });
    }
  }

  // (c) cross-entity near-duplicate names
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const d = levenshtein(entities[i].name_en, entities[j].name_en);
      if (d > 0 && d <= 2) {
        candidates.push({
          entity_id: `${entities[i].id}+${entities[j].id}`,
          variants: [entities[i].name_en, entities[j].name_en],
          fact_ids: [],
        });
      }
    }
  }

  if (candidates.length === 0) return [];

  const user = `다음은 표기 변형 의심 후보다. 각 후보에 대해 동일 대상의 표기 갈림인지 판정하고, 갈림이면 위반으로 보고하라.
소스 티어 우선순위: official-site > steam-official > dev-note > official-wiki > community-wiki > press. 상위 티어 표기를 기준 표기로 권고하라.

후보:
${candidates
  .map(
    (c) =>
      `- 엔티티 ${c.entity_id}: 표기들 [${c.variants.join(" / ")}]${
        c.fact_ids.length ? `, 관련 팩트: ${c.fact_ids.join(", ")}` : ""
      }`
  )
  .join("\n")}

관련 팩트 내용:
${candidates
  .flatMap((c) => c.fact_ids)
  .map((id) => factById.get(id))
  .filter((f): f is Fact => !!f)
  .map((f) => `- ${compactFact(f)} (출처 티어: ${f.sources.map((s) => s.source_tier).join(",")})`)
  .join("\n")}

출력 JSON: {"findings":[{"severity":"critical|warning|info","fact_ids":["FACT-.."],"verdict_ko":"...","evidence_ko":"...","recommendation_ko":"..."}]}
표기 충돌은 로컬라이제이션 실무에 직결되므로 명백한 갈림은 critical로 판정한다. 관련 팩트 ID가 없는 후보는 fact_ids를 빈 배열로 두되, 근거를 evidence_ko에 서술하라.`;

  const res = await askJson({
    system: `너는 게임 세계관 QA 도구의 표기 일관성 검사기다.\n${JUDGE_CONTRACT}`,
    user,
    schema: FindingsSchema,
  });
  return res.findings;
}

// ---------------------------------------------------------------------------
// C1 — timeline conflicts: all timeline facts in one LLM pass
// ---------------------------------------------------------------------------
async function runC1(): Promise<Finding[]> {
  const timelineFacts = facts.filter((f) => f.claim_type === "timeline");
  if (timelineFacts.length < 2) return [];

  const user = `다음은 지식베이스의 연표(timeline) 팩트 전체다. 사건의 시점·순서가 서로 모순되는 쌍이 있는지 검사하라.
주의: status가 superseded인 팩트는 이미 대체된 이력이므로, active 팩트와의 차이는 모순이 아니라 '설정 변경 이력'이다(위반 아님). active 팩트끼리의 시간 관계 모순만 보고하라. 핵심 기준 팩트: 회귀 폭은 '1년'이다.

${timelineFacts.map(compactFact).join("\n")}

출력 JSON: {"findings":[{"severity":"critical|warning|info","fact_ids":["FACT-.."],"verdict_ko":"...","evidence_ko":"...","recommendation_ko":"..."}]}
모순이 없으면 findings를 빈 배열로 출력하라.`;

  const res = await askJson({
    system: `너는 게임 세계관 QA 도구의 연표 충돌 검사기다.\n${JUDGE_CONTRACT}`,
    user,
    schema: FindingsSchema,
  });
  return res.findings;
}

// ---------------------------------------------------------------------------
// C2 — lore contradictions: per-entity fact groups, batched
// ---------------------------------------------------------------------------
async function runC2(): Promise<Finding[]> {
  const groups: { entity: string; facts: Fact[] }[] = [];
  for (const e of entities) {
    const group = facts.filter(
      (f) => f.entity_ids.includes(e.id) && f.claim_type !== "naming"
    );
    const hasHistory = group.some(
      (f) => f.status === "superseded" || f.status === "conflicted" || f.status === "deprecated"
    );
    if (group.length >= 2 && (hasHistory || group.length >= 3)) {
      groups.push({ entity: `${e.id} (${e.name_ko})`, facts: group });
    }
  }

  const findings: Finding[] = [];
  const BATCH = 6;
  for (let i = 0; i < groups.length; i += BATCH) {
    const batch = groups.slice(i, i + BATCH);
    const user = `다음은 엔티티별 팩트 묶음이다. 각 묶음 안에서 양립 불가능한 진술(설정 모순)을 탐지하라.
판정 기준:
- active 팩트끼리 서로 모순 -> critical 또는 warning으로 보고.
- superseded 팩트와 그 후속(active) 팩트의 차이 -> 모순이 아니라 '설정 개편 이력'이다. 이 경우 severity를 info로 하여 "설정 변경 이력 확인" 항목으로 보고하라 (변경 전후 내용을 evidence_ko에 요약).
- deprecated 팩트(폐기된 설정)가 존재하면 info로 그 사실을 보고하라.

${batch
  .map(
    (g) => `## ${g.entity}
${g.facts.map(compactFact).join("\n")}`
  )
  .join("\n\n")}

출력 JSON: {"findings":[{"severity":"critical|warning|info","fact_ids":["FACT-.."],"verdict_ko":"...","evidence_ko":"...","recommendation_ko":"..."}]}
보고할 것이 없으면 findings를 빈 배열로 출력하라.`;

    const res = await askJson({
      system: `너는 게임 세계관 QA 도구의 설정 모순 검사기다.\n${JUDGE_CONTRACT}`,
      user,
      schema: FindingsSchema,
      maxTokens: 3000,
    });
    findings.push(...res.findings);
  }
  return findings;
}

// ---------------------------------------------------------------------------
// C4 — tone violations: rule-based pattern scan over statements (KB self-check)
// ---------------------------------------------------------------------------
function runC4(): Finding[] {
  const findings: Finding[] = [];
  for (const f of facts) {
    // tone-canon facts describe the rules themselves — scanning them is a false positive
    if (f.claim_type === "tone-canon") continue;
    for (const bp of toneCanon.banned_patterns) {
      const re = new RegExp(bp.pattern);
      if (re.test(f.statement_ko)) {
        findings.push({
          severity: bp.severity,
          fact_ids: [f.id],
          verdict_ko: `톤 캐논 위반 후보: ${bp.label}`,
          evidence_ko: `${f.id}의 진술에서 금지 패턴 '${bp.pattern}' 매칭: "${f.statement_ko}"`,
          recommendation_ko: "다크 판타지 톤에 맞는 어휘로 재기술을 검토하라.",
        });
      }
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// C5 — unresolved foreshadowing: LLM extraction vs existing ledger
// ---------------------------------------------------------------------------
async function runC5(): Promise<Finding[]> {
  const loreFacts = facts.filter(
    (f) => f.claim_type !== "naming" && f.status === "active"
  );
  const user = `다음은 세계관 팩트와 현재 복선 원장 목록이다. 팩트에서 '언급됐으나 회수되지 않은 설정(복선)' 후보를 추출하고, 원장에 아직 없는 것만 보고하라.

## 현재 복선 원장 (이미 등록됨 — 중복 보고 금지)
${foreshadowing.map((fs_) => `- ${fs_.id}: ${fs_.title_ko}`).join("\n")}

## 팩트
${loreFacts.map(compactFact).join("\n")}

출력 JSON: {"findings":[{"severity":"info","fact_ids":["FACT-.."],"verdict_ko":"미회수 복선 후보: <제목>","evidence_ko":"...","recommendation_ko":"복선 원장 등록 검토"}]}
원장에 이미 있는 항목과 실질적으로 같은 내용이면 보고하지 않는다. 새 후보가 없으면 빈 배열을 출력하라.`;

  const res = await askJson({
    system: `너는 게임 세계관 QA 도구의 미해소 복선 검사기다.\n${JUDGE_CONTRACT}`,
    user,
    schema: FindingsSchema,
    maxTokens: 3000,
  });
  return res.findings.map((f) => ({ ...f, severity: "info" as const }));
}

// ---------------------------------------------------------------------------
async function main() {
  console.log(`Running checks against KB ${meta.kb_version} (${facts.length} facts)...`);
  const reports: CheckReport[] = [];
  let seq = 0;
  const now = new Date().toISOString();

  const push = (check: CheckReport["check_type"], findings: Finding[]) => {
    for (const f of findings) {
      seq += 1;
      reports.push({
        id: `CHK-${String(seq).padStart(4, "0")}`,
        kb_version: meta.kb_version,
        check_type: check,
        severity: f.severity,
        fact_ids: f.fact_ids.filter((id) => factById.has(id)),
        verdict_ko: f.verdict_ko,
        evidence_ko: f.evidence_ko,
        recommendation_ko: f.recommendation_ko,
        created_at: now,
      });
    }
    console.log(`  ${check}: ${findings.length} finding(s)`);
  };

  const runSafe = async (
    check: CheckReport["check_type"],
    fn: () => Promise<Finding[]> | Finding[]
  ) => {
    try {
      push(check, await fn());
    } catch (err) {
      seq += 1;
      reports.push({
        id: `CHK-${String(seq).padStart(4, "0")}`,
        kb_version: meta.kb_version,
        check_type: check,
        severity: "warning",
        fact_ids: [],
        verdict_ko: "parse-error: 판정 결과를 해석하지 못함",
        evidence_ko: String(err instanceof Error ? err.message : err),
        recommendation_ko: "검사를 재실행하라 (pnpm check --force).",
        created_at: now,
      });
      console.error(`  ${check}: parse-error (${err instanceof Error ? err.message : err})`);
    }
  };

  await runSafe("C1", runC1);
  await runSafe("C2", runC2);
  await runSafe("C3", runC3);
  await runSafe("C4", () => runC4());
  await runSafe("C5", runC5);

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(reports, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${reports.length} report item(s) -> ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
