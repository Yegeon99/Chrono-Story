// Verification gate pipeline (DIRECTIVE Phase 4).
// (1) rule-based entity extraction -> (2) fact selection -> (3) LLM judgment (C1~C4).
// Server-only: used by /api/gate and scripts/precompute-demos.ts.
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { loadEntities, loadFacts } from "./kb";
import { ToneCanonSchema, type Entity, type Fact } from "./schema";
import { askJson, JUDGE_CONTRACT } from "./claude";

export const GateIssueSchema = z.object({
  check_type: z.enum(["C1", "C2", "C3", "C4"]),
  severity: z.enum(["critical", "warning", "info"]),
  description_ko: z.string(),
  evidence_fact_ids: z.array(z.string()),
  suggestion_ko: z.string(),
});
export const GateResultSchema = z.object({
  verdict: z.enum(["PASS", "WARN", "FAIL"]),
  summary_ko: z.string(),
  issues: z.array(GateIssueSchema),
});
export type GateIssue = z.infer<typeof GateIssueSchema>;
export type GateResult = z.infer<typeof GateResultSchema>;

export const GateDemoSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  input_text: z.string(),
  result: GateResultSchema,
  matched_entity_ids: z.array(z.string()),
  computed_at: z.string(),
});
export type GateDemo = z.infer<typeof GateDemoSchema>;

export function extractEntities(text: string, entities: Entity[]): Entity[] {
  const lower = text.toLowerCase();
  return entities.filter((e) => {
    const names = [e.name_ko, e.name_en, ...e.aliases];
    return names.some((n) => n.length >= 2 && lower.includes(n.toLowerCase()));
  });
}

export function selectFacts(matched: Entity[], facts: Fact[]): Fact[] {
  const ids = new Set(matched.map((e) => e.id));
  const selected = facts.filter((f) => f.entity_ids.some((id) => ids.has(id)));
  // Tone-canon facts are always in scope for C4
  for (const f of facts) {
    if (f.claim_type === "tone-canon" && !selected.includes(f)) selected.push(f);
  }
  return selected.slice(0, 60);
}

function ruleToneScan(text: string): GateIssue[] {
  const toneCanon = ToneCanonSchema.parse(
    JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data", "tone-canon.json"), "utf-8")
    )
  );
  const issues: GateIssue[] = [];
  for (const bp of toneCanon.banned_patterns) {
    const m = text.match(new RegExp(bp.pattern));
    if (m) {
      issues.push({
        check_type: "C4",
        severity: bp.severity,
        description_ko: `톤 캐논 위반(${bp.label}): 입력 텍스트에서 "${m[0]}" 표현이 감지되었습니다. 세계관 텍스트는 중세 다크 판타지 어조를 유지해야 합니다.`,
        evidence_fact_ids: ["FACT-0080", "FACT-0081"],
        suggestion_ko: "해당 표현을 세계관 어조에 맞는 어휘로 교체하세요.",
      });
    }
  }
  return issues;
}

/** Verdict is derived server-side, never trusted from the LLM directly.
 *  Tone (C4) caps at WARN; only clear lore conflicts (C1~C3 critical) yield FAIL. */
function deriveVerdict(issues: GateIssue[]): GateResult["verdict"] {
  if (issues.some((i) => i.check_type !== "C4" && i.severity === "critical")) return "FAIL";
  if (issues.length > 0) return "WARN";
  return "PASS";
}

export async function judgeText(text: string): Promise<{
  result: GateResult;
  matched: Entity[];
  factCount: number;
}> {
  const entities = loadEntities();
  const facts = loadFacts();
  const matched = extractEntities(text, entities);
  const selected = selectFacts(matched, facts);
  const factById = new Map(facts.map((f) => [f.id, f]));

  const factContext = selected
    .map((f) => {
      const names = f.entity_ids
        .map((id) => entities.find((e) => e.id === id)?.name_ko ?? id)
        .join(", ");
      return `${f.id} [${f.claim_type}/${f.status}/${f.confidence}] (${names}) ${f.statement_ko}`;
    })
    .join("\n");

  const user = `## 검증 대상 텍스트 (신규 원고)
"""
${text}
"""

## 지식베이스 팩트 (근거 자료)
${factContext || "(관련 팩트 없음)"}

## 검사 항목
- C1 연표: 텍스트의 시간 관계가 팩트와 모순되는가 (핵심: 회귀 폭은 정확히 '1년').
- C2 설정: 텍스트의 주장(관계·속성·사건)이 active 팩트와 양립 불가능한가.
- C3 표기: 고유명사 표기가 지식베이스 표준 표기와 다른가 (오탈자·변형).
- C4 톤: 중세 다크 판타지 어조를 깨는 표현이 있는가.

## 판정 기준
- 명백한 설정·연표 충돌(C1~C3) = critical.
- 근거가 약하거나 해석 여지가 있으면 warning 이하.
- 지식베이스에 없는 신규 설정은 위반이 아니다. 단, 기존 설정과 충돌하면 위반이다.
- superseded/deprecated 팩트는 현행 기준이 아니다. active 팩트만 기준으로 삼아라.

출력 JSON:
{"verdict":"PASS|WARN|FAIL","summary_ko":"판정 요약 1~2문장","issues":[{"check_type":"C1|C2|C3|C4","severity":"critical|warning|info","description_ko":"...","evidence_fact_ids":["FACT-.."],"suggestion_ko":"수정 제안"}]}
문제가 없으면 issues를 빈 배열로, verdict를 PASS로 출력하라.`;

  const llm = await askJson({
    system: `너는 게임 내러티브 CI의 검증 게이트다. 신규 텍스트가 확정된 세계관 지식베이스와 충돌하는지 판정한다.\n${JUDGE_CONTRACT}`,
    user,
    schema: GateResultSchema,
  });

  // Evidence enforcement (PRD §8): issues citing no valid fact are demoted below critical
  const issues: GateIssue[] = llm.issues.map((i) => {
    const validIds = i.evidence_fact_ids.filter((id) => factById.has(id));
    return {
      ...i,
      evidence_fact_ids: validIds,
      severity: validIds.length === 0 && i.severity === "critical" ? "warning" : i.severity,
    };
  });

  // Merge rule-based tone findings, avoiding duplicates with LLM C4 issues
  for (const t of ruleToneScan(text)) {
    if (!issues.some((i) => i.check_type === "C4" && i.severity === t.severity)) {
      issues.push(t);
    }
  }

  const result: GateResult = {
    verdict: deriveVerdict(issues),
    summary_ko: llm.summary_ko,
    issues,
  };
  return { result, matched, factCount: selected.length };
}
