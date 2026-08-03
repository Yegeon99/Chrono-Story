# LOREGUARD_DIRECTIVE.md
## Lore Guard — Claude Code 실행 지침서

> 이 문서는 Claude Code가 자율적으로 프로젝트를 구축하기 위한 실행 명세다.
> 상위 문서: `PRD.md` (요구사항의 원천 — 충돌 시 PRD가 우선하되, 기술 세부는 본 지침서가 우선)
> 사용자: 비개발자. 모든 기술적 판단·에러 해결은 자율 수행하고, 보고는 비개발자가 이해할 1문장 요약으로 한다.

---

## 0. 절대 원칙 (모든 Phase에 적용)

1. **자율 에러 해결**: 빌드 실패·의존성 충돌·타입 에러는 스스로 진단·수정한다. 사용자에게 묻는 것은 "기능 방향의 갈림길"뿐이다. 수정 후 "무엇이 잘못됐고 어떻게 고쳤는지" 1문장으로 요약 보고.
2. **최고 품질 기본값**: "일단 돌아가는 수준" 금지. 임시 디자인·플레이스홀더 룩 금지. 타이포·간격·색·정렬·인터랙션을 프리미엄 제품 기준으로.
3. **단계 확인 게이트**: 각 Phase 완료 시 산출물 요약 + 스크린샷(UI가 있는 경우)을 제시하고 다음 Phase 진행 여부를 확인받는다. 게이트를 건너뛰지 않는다.
4. **저작권 가드레일 (코드 강제)**:
   - 리포지토리에 원문 전문 텍스트 파일을 커밋하지 않는다. 수집 스크립트는 팩트 추출 결과(자체 재기술 문장)만 저장.
   - 팩트 카드의 원문 인용 필드는 스키마 수준에서 `maxLength` 검증(한글 40자/영문 90자 상당)을 걸어 15단어 미만을 강제.
   - 게임 아트·스크린샷 에셋 사용 금지. `/public`에 게임 이미지 파일이 들어가면 안 된다.
   - 전역 푸터 + README에 비공식 고지 문구 삽입 (PRD §6.4 문구 그대로).
5. **API 키 보안**: `ANTHROPIC_API_KEY`는 `.env.local` + Vercel 환경변수로만. 클라이언트 번들에 절대 노출 금지. 모든 LLM 호출은 서버 라우트(`/app/api/*`) 경유. `.env*`는 `.gitignore`에 포함.
6. **커밋 규칙**: Phase 단위 + 의미 단위로 커밋. 메시지 형식 `feat(kb): ...` / `fix(check): ...` / `data(kb): 2026.08 변경 반영`. **지식베이스 JSON 변경은 반드시 독립 커밋** — git 히스토리가 곧 KB 버전 이력이다(PRD F6의 설계 근간).
7. **언어**: 코드 주석·커밋 메시지는 영문, UI 문구·문서·사용자 보고는 한국어.

---

## 1. 기술 스택 (고정)

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js 15 (App Router, TypeScript strict) |
| 스타일 | Tailwind CSS v4 |
| 상태 | React 상태 + 서버 컴포넌트 우선. 전역 스토어는 필요해질 때만 Zustand |
| LLM | Claude API — 모델 `claude-sonnet-4-6` (검사·판정), 서버 라우트 전용 |
| 그래프 | 1차: 자체 SVG + d3-force(레이아웃 계산만). 노드 100개 미만이므로 중량 라이브러리(react-flow 등) 도입 금지 |
| 데이터 | `/data/*.json` 파일 기반. zod 스키마 검증 |
| 수집 | `/scripts/ingest.ts` — 수동 실행 Node 스크립트 |
| 검증 | Playwright (스크린샷 + 핵심 플로우) |
| 배포 | Vercel |

## 2. 폴더 구조

```
loreguard/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx                 # ① 개요
│   │   ├── knowledge/page.tsx       # ② KB 탐색 (리스트 + 그래프)
│   │   ├── reports/page.tsx         # ③ 검사 리포트
│   │   ├── glossary/page.tsx        # ④ 용어집
│   │   ├── gate/page.tsx            # ⑤ 검증 게이트
│   │   └── ledger/page.tsx          # ⑥ 복선 원장
│   └── api/
│       ├── gate/route.ts            # 검증 게이트 판정 (스트리밍)
│       └── check/route.ts           # 정합성 검사 실행
├── data/
│   ├── entities.json
│   ├── facts.json
│   ├── relations.json
│   ├── glossary.json                # 빌드 시 facts에서 파생 생성
│   ├── foreshadowing.json
│   ├── reports/                     # 검사 리포트 산출물 (버전별)
│   └── kb-meta.json                 # KB 버전, 소스 레지스트리
├── scripts/
│   ├── ingest.ts                    # 소스 URL → 팩트 추출 → JSON 갱신 + diff 리포트
│   ├── check.ts                     # C1~C5 일괄 검사 → reports/ 저장
│   └── build-glossary.ts
├── lib/
│   ├── schema.ts                    # zod 스키마 (팩트/엔티티/관계/복선/리포트)
│   ├── kb.ts                        # KB 로드·질의 유틸
│   └── claude.ts                    # API 클라이언트 (서버 전용)
└── e2e/                             # Playwright
```

## 3. 데이터 스키마 (zod로 구현)

PRD §4 F1의 팩트 스키마를 그대로 구현하고, 다음을 추가한다.

- `Entity`: `id`, `type`, `name_ko`, `name_en`, `aliases[]`(표기 변형 — Etheldrena/Etheldreda 병기용), `summary_ko`(자체 재기술 1~2문장), `status`
- `Relation`: `id`, `from`, `to`, `type`(`sentinel_of` / `member_of` / `leads` / `created` / `opposes` / `allied_with` / `located_in` / `wields` / `transformed_into`), `fact_ids[]`(근거)
- `Foreshadowing`: `id`, `title_ko`, `summary_ko`, `status`(`unresolved`/`resurfaced`/`resolved`/`abandoned`), `linked_fact_ids[]`, `history[]`({date, event, source_url})
- `CheckReport`: `id`, `kb_version`, `check_type`(C1~C5), `severity`, `fact_ids[]`, `verdict_ko`, `evidence_ko`, `recommendation_ko`, `created_at`
- 모든 JSON은 로드 시 zod 검증. 검증 실패는 빌드 실패로 처리(내러티브 CI 도구가 자기 데이터도 CI한다).

## 4. Phase별 실행 계획

### Phase 0 — 셋업
- Next.js + Tailwind v4 + TypeScript strict 초기화, zod 스키마 작성, 샘플 데이터 3건으로 검증 통과 확인.
- 디자인 토큰 파일 확정 (§5).
- **DoD**: `pnpm build` 성공, 스키마 테스트 통과. → 게이트 확인

### Phase 1 — 시드 지식베이스
- PRD §4 F1 시드 목록 전체를 `entities.json`/`facts.json`/`relations.json`으로 작성. 목표: 엔티티 40+, 팩트 120+, 관계 60+.
- 팩트 문장은 전부 자체 재기술. 각 팩트에 출처 URL + 티어 + 수집일 기입.
- **실증 충돌 3건을 의도적으로 원상태 그대로 등록** (`conflicted` / `superseded` 상태):
  1. `Etheldrena` vs `Etheldreda` (naming, conflicted)
  2. 초기 서사 "이드리긴이 12신에 대항" → 현행 "프론티어가 보이드에 대항" (relation, superseded 체인)
  3. 개발 총괄 표기 변경 이력 (attribute, superseded — 메타 정보 카테고리로)
- 시드 복선 10건 이상을 `foreshadowing.json`에 등록 (PRD F5 시드 후보 + 추출분).
- **DoD**: 카운트 목표 달성, zod 전체 통과. → 게이트 확인

### Phase 2 — 검사 엔진
- `scripts/check.ts`: C1~C5 구현.
  - C3(표기): 규칙 기반 1차(정규화 + 편집거리 ≤2 후보 추출) → LLM 동일 대상 판정 2차. 비용 절감 원칙.
  - C1/C2(연표·모순): 엔티티별 팩트 묶음 단위로 LLM 대조. 프롬프트에 "근거 팩트 ID를 반드시 인용, 근거 없으면 위반 보고 금지" 명시.
  - C4(톤): 톤 캐논 문서(`data/tone-canon.json` — 다크 판타지 어휘 원칙, 금지 패턴)를 먼저 작성하고 이를 기준으로 판정.
  - C5(복선): 미회수 설정 후보 추출 → foreshadowing.json과 대조, 신규면 추가 제안.
- 판정 결과는 `data/reports/`에 저장 (UI는 파일을 읽어 렌더 — 데모 시 API 재호출 불필요).
- **DoD**: 실증 충돌 3건이 리포트에 자동 탐지됨 (PRD G2). → 게이트 확인

### Phase 3 — 용어집
- `build-glossary.ts`: naming 팩트 → glossary.json 파생. 충돌 항목 배지 처리.
- UI: 검색(초성 포함), 타입/상태/신뢰도 필터, CSV·JSON 내보내기(클라이언트 생성 다운로드).
- CSV 컬럼: `ko, en, variants, type, definition_ko, source_url, confidence, status`.
- **DoD**: CSV 다운로드가 스프레드시트에서 즉시 열림, 충돌 배지 시각 확인. → 게이트 확인

### Phase 4 — 검증 게이트 (라이브 데모의 심장)
- `/api/gate`: 입력 텍스트 → (1) 엔티티·주장 추출 → (2) 관련 팩트 검색(엔티티 매칭) → (3) C1~C4 판정 → 스트리밍 응답.
- 판정 프롬프트 원칙: KB 팩트를 컨텍스트로 주입하되 관련 엔티티의 팩트만 선별 주입(토큰 절약). 출력은 구조화 JSON(verdict, issues[], evidence_fact_ids[], suggestion).
- UI: 입력 → 진행 단계 표시(추출 중 → 대조 중 → 판정) → 인장 판정 연출(§5 시그니처) → 근거 팩트 카드.
- 데모 시나리오 3종(PASS/FAIL/WARN) 버튼: 사전 정의 입력 텍스트 + **사전 계산된 판정 결과를 우선 표시**하고 "실시간 재판정" 버튼 별도 제공 (데모 안정성 + 라이브 증명 양립).
- **DoD**: 3 시나리오 모두 정상 판정, 판정 30초 내, 근거 인용 표시. → 게이트 확인

### Phase 5 — 복선 원장 + 변경 감지
- `scripts/ingest.ts`: 소스 URL 입력 → 본문 팩트 추출(LLM) → 기존 KB와 NEW/CHANGED/CONFIRMED 3분류 → JSON 갱신 + `data/reports/change-YYYY.MM.md` 생성 → 재부상 복선 탐지(foreshadowing 대조) → 결과 요약 출력.
- CHANGED 처리: 기존 팩트 `status: superseded` + `superseded_by` 링크. 삭제 금지 — 이력이 자산이다.
- 원장 UI: 생명주기 4열 칸반 + 항목 클릭 시 이력 타임라인.
- **시연용 실행 1회**: 5차 개발자 노트(2026-05-07) 소스를 파이프라인에 실제 투입해 변경 리포트 생성 → 대시보드 "재부상한 복선" 섹션에 결과 반영.
- **DoD**: 시연 실행의 변경 리포트가 개요 화면에 노출, KB 버전 태그 갱신, 독립 데이터 커밋 존재. → 게이트 확인

### Phase 6 — 대시보드 완성·배포
- 6개 화면 완성, 관계망 그래프(리스트 뷰 안정화 후 착수), 반응형·접근성 점검.
- Playwright: 6개 화면 스크린샷 + 게이트 플로우(입력→판정) + 용어집 CSV 다운로드 검증.
- Vercel 배포, 환경변수 설정, README(프로젝트 소개 + 비공식 고지 + 아키텍처 다이어그램).
- **DoD**: 라이브 URL, 전 스크린샷 검증 통과, Lighthouse 성능 90+ 목표. → 최종 보고

## 5. 디자인 시스템 명세

**콘셉트**: "고문서 보관소의 계기판" — 어두운 서고의 무게감 위에 정밀 계측 도구의 명료함. 다크 판타지 무드는 배경·질감·타이포로 내고, 데이터 표면은 철저히 가독 우선.

**금지**: 보라 그라디언트 SaaS 룩, 기본 shadcn 무가공 룩, 네온 아시드 단색 액센트 클리셰, 게임 원본 아트.

**컬러 토큰** (CSS 변수로 정의):

| 토큰 | 값 | 용도 |
|---|---|---|
| `--ink-950` | `#0C0E13` | 배경 최심부 |
| `--ink-900` | `#12151D` | 카드/패널 |
| `--ink-700` | `#232838` | 보더·구분선 |
| `--parchment` | `#E8E2D4` | 본문 텍스트 (순백 금지 — 고문서 톤) |
| `--parchment-dim` | `#9A958A` | 보조 텍스트 |
| `--gilt` | `#C9A227` | 액센트 — 제목 장식, 활성 상태, 인장 |
| `--verdant` | `#4C8F6E` | PASS |
| `--ember` | `#B8452F` | FAIL / critical |
| `--amber-warn` | `#C97F2E` | WARN |
| `--rift-teal` | `#3E7C8A` | 시간·복선 모티프 (재부상 하이라이트) |

**타이포그래피**:
- 디스플레이(제목·인장): **Noto Serif KR** (700/900) — 획의 무게로 고문서 인상. 자간 -0.01em.
- 본문·UI: **Pretendard** (400/500/600).
- 데이터·ID·코드: **JetBrains Mono** — 팩트 ID, KB 버전, 신뢰도 라벨.
- 스케일: 12 / 13 / 15(기준) / 18 / 24 / 34 / 48. 행간 본문 1.65.

**시그니처 요소 (1개, 여기에만 볼드니스 소진)**: 검증 게이트 판정 연출 — 판정 확정 순간 결과 배지가 **인장이 눌리듯** 나타난다(scale 1.15→1.0 + 짧은 잉크 번짐 원, 350ms, `prefers-reduced-motion` 시 페이드로 대체). PASS는 verdant 인장, FAIL은 ember 인장, WARN은 amber. 다른 화면의 모션은 hover 미세 반응과 페이지 전환 페이드로 절제.

**구조 장치**: 팩트 카드는 상단에 `FACT-0017 · timeline · confirmed` 형태의 모노스페이스 아이브로우 — 장식이 아니라 데이터의 신원. 충돌 상태 카드는 좌측 2px ember 보더. superseded 카드는 취소선 없이 `→ 후속 팩트` 링크와 dim 처리(이력은 존중해서 표시).

**품질 플로어**: 모바일 반응형(그래프 뷰는 모바일에서 리스트로 폴백), 포커스 링 가시화(`--gilt` 2px), reduced-motion 전면 대응, 다크 단일 테마(라이트 모드 없음 — 콘셉트상 의도).

## 6. LLM 호출 규칙

- 모델: `claude-sonnet-4-6`. 판정류 `max_tokens` 2000 이내, temperature 낮게(0.2).
- 모든 판정 프롬프트 공통 계약: ① 근거 팩트 ID 인용 필수 ② 근거 없으면 위반 보고 금지 ③ 출력은 zod로 파싱 가능한 JSON only ④ 불확실하면 severity를 낮춰라.
- 파싱 실패 시 1회 재시도(포맷 교정 지시) 후 실패는 리포트에 `parse-error`로 기록 — 조용히 삼키지 않는다.
- 검사 결과는 파일 캐시. 동일 KB 버전에 대한 재검사는 캐시 우선.

## 7. 사용자 보고 형식

각 Phase 게이트에서 다음 형식으로 보고한다:

```
[Phase N 완료] 한 줄 요약
- 만든 것: (비개발자 언어로 2~3항목)
- 확인 필요: (있을 때만 — 기능 방향 갈림길만)
- 스크린샷: (UI Phase의 경우)
다음 Phase 진행할까요?
```

에러를 해결한 경우: "OO가 안 돼서(원인) OO로 고쳤습니다(조치)" 1문장. 기술 용어 나열 금지.
