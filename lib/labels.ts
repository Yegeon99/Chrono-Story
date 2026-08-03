// Korean display labels for KB enum values. UI copy lives here (DIRECTIVE §0.7).

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  character: "인물",
  location: "지역",
  faction: "세력",
  artifact: "유물",
  event: "사건",
  planet: "행성",
  concept: "개념",
  creature: "존재",
};

export const CLAIM_TYPE_LABELS: Record<string, string> = {
  timeline: "연표",
  relation: "관계",
  attribute: "속성",
  naming: "표기",
  "tone-canon": "톤 캐논",
};

export const FACT_STATUS_LABELS: Record<string, string> = {
  active: "현행",
  superseded: "대체됨",
  deprecated: "폐기",
  conflicted: "충돌",
};

export const CONFIDENCE_LABELS: Record<string, string> = {
  confirmed: "확정",
  probable: "유력",
  speculative: "추정",
};

export const RELATION_TYPE_LABELS: Record<string, string> = {
  sentinel_of: "센티넬",
  member_of: "소속",
  leads: "지휘",
  created: "창조·유발",
  opposes: "대립",
  allied_with: "동맹",
  located_in: "위치",
  wields: "소유",
  transformed_into: "변이",
};

export const SOURCE_TIER_LABELS: Record<string, string> = {
  "official-site": "공식 사이트",
  "steam-official": "스팀 공식",
  "dev-note": "개발자 노트",
  "official-wiki": "공식 위키",
  "community-wiki": "커뮤니티 위키",
  press: "언론 보도",
};
