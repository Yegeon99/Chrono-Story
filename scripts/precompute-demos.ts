// Precompute the three demo scenarios for the verification gate (DIRECTIVE Phase 4).
// Demo buttons show these results instantly; live re-judgment stays available.
import "./env";
import fs from "node:fs";
import path from "node:path";
import { judgeText } from "../lib/gate";

const SCENARIOS = [
  {
    id: "pass",
    label: "PASS 시나리오",
    description: "기존 설정과 부합하는 무난한 퀘스트 대사",
    input_text:
      "카야가 낮은 목소리로 말했다. \"새벽 비탈은 이미 버려졌다. 남은 정착민들마저 떠날 채비를 하고 있지. 보이드가 이 땅을 잠식하기 전에, 뱅가드가 길을 열어야 한다.\" 주인공은 크로노텍터를 움켜쥐고 고개를 끄덕였다.",
  },
  {
    id: "fail",
    label: "FAIL 시나리오",
    description: "명백한 연표 충돌 — 회귀 폭이 1년이 아니라 10년으로 서술됨",
    input_text:
      "벨리아가 손을 뻗자 시간의 격류가 주인공을 감쌌다. \"10년 전으로 돌아가라. 그때라면 아직 늦지 않았다.\" 10년의 세월을 거슬러, 주인공은 보이드가 오기 전의 세테라에 눈을 떴다.",
  },
  {
    id: "warn",
    label: "WARN 시나리오",
    description: "다크 판타지 톤을 깨는 현대적 어휘가 섞인 대사",
    input_text:
      "베텔기우스가 씩 웃으며 말했다. \"오케이, 이번 작전은 내가 캐리한다. 보이드쯤은 레벨업 노가다로 충분하지. 파이팅!\" 그는 크로노텍터를 어깨에 걸쳤다.",
  },
];

async function main() {
  const demos = [];
  for (const s of SCENARIOS) {
    console.log(`Judging demo "${s.id}"...`);
    const { result, matched } = await judgeText(s.input_text);
    console.log(`  -> ${result.verdict} (${result.issues.length} issue(s))`);
    demos.push({
      ...s,
      result,
      matched_entity_ids: matched.map((e) => e.id),
      computed_at: new Date().toISOString(),
    });
  }
  const outFile = path.join(process.cwd(), "data", "gate-demos.json");
  fs.writeFileSync(outFile, JSON.stringify(demos, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${demos.length} demos -> ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
