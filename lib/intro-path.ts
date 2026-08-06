// Curated onboarding path for first-time visitors (Phase 6, option 2).
// Purely additive to the knowledge explorer. QA remains the product's core.

export type IntroStep = {
  title: string;
  description: string;
  entity_ids: string[];
};

export const INTRO_STEPS: IntroStep[] = [
  {
    title: "주요 인물, 시간을 짊어진 자들",
    description:
      "이야기의 축은 센티넬이다. 세테라 함락 직전 크로노텍터를 얻어 센티넬이 된 주인공, 그를 1년 전 과거로 돌려보낸 로디니아의 센티넬 벨리아, 그리고 보이드를 깨워 모든 비극을 시작한 마젤란의 센티넬 베텔기우스. 인물을 클릭하면 관련 팩트와 관계가 표시됩니다.",
    entity_ids: [
      "ENT-PROTAGONIST",
      "ENT-VELIA",
      "ENT-BETELGEUSE",
      "ENT-ETHELDRENA",
      "ENT-IOBIS",
      "ENT-CHRONOS",
    ],
  },
  {
    title: "세력 지형, 누가 무엇을 위해 싸우는가",
    description:
      "보이드에 맞서는 최전선 프론티어와 그 정예 뱅가드, 시간의 신을 섬기는 크로노스 교단, 살아남기 위해 떠도는 정착민과 월드 무버, 그리고 보이드를 섬기는 데스리스까지, 세테라의 세력 구도를 살펴보세요.",
    entity_ids: [
      "ENT-FRONTIER",
      "ENT-VANGUARD",
      "ENT-CHRONOS-ORDER",
      "ENT-SETTLERS",
      "ENT-WORLD-MOVERS",
      "ENT-DEATHLESS",
    ],
  },
  {
    title: "핵심 사건, 세계가 무너진 순서",
    description:
      "베텔기우스가 깨운 보이드가 12행성에 퍼진 '보이드 창궐', 벨리아가 함락 직전의 행성을 시간째 얼려버린 '로디니아 시간 정지', 그리고 주인공을 정확히 1년 전으로 돌려보낸 '1년 회귀'. 이 세 사건의 시간 관계가 모든 정합성 검사의 기준이 됩니다.",
    entity_ids: [
      "ENT-VOID-OUTBREAK",
      "ENT-RODINIA-TIME-FREEZE",
      "ENT-ONE-YEAR-REGRESSION",
      "ENT-VOID",
      "ENT-TEMPORAL-RIFT",
    ],
  },
];
