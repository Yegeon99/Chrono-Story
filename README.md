# Lore Guard — 세계관 정합성 QA 에이전트 (내러티브 CI)

크로노 오디세이(Chrono Odyssey)의 공개 세계관 자료를 **엔티티–팩트–관계–출처** 4층 구조의
지식베이스로 구조화하고, 그 위에서 **표기 불일치·연표 충돌·설정 모순·톤 위반·미해소 복선**을
자동 탐지하는 QA 도구입니다. 코드에 CI가 있듯, 내러티브에 CI를 답니다.

> **비공식 고지** — 본 프로젝트는 크로노스튜디오·카카오게임즈와 무관한 비공식 팬
> 포트폴리오이며, 크로노 오디세이의 모든 권리는 해당 권리자에게 있습니다.

## 무엇을 하는가

| 기능 | 설명 |
|---|---|
| **지식베이스** | 공개 소스에서 추출·재기술한 엔티티 53 / 팩트 132 / 관계 69. 모든 팩트는 출처 URL·티어·신뢰도 보유. 관계망 그래프 + 세계관 입문 경로 제공 |
| **정합성 검사 (C1~C5)** | 연표 충돌·설정 모순·표기 일관성·톤 위반·미해소 복선 5종 검사. 규칙 기반 후보 선별 후 LLM 판정, 근거 팩트 인용 강제 |
| **검증 게이트** | 신규 텍스트를 붙여넣으면 지식베이스와 대조해 30초 내 PASS/WARN/FAIL 판정 (실측 ~7초). 데모 시나리오 3종 |
| **한영 용어집** | naming 팩트에서 자동 편찬. 충돌 표기는 배지와 함께 병기. CSV(BOM)/JSON 내보내기 |
| **복선 원장** | 미해소 설정을 자산으로 축적. 신규 소스 유입 시 재부상 자동 탐지, 생명주기 칸반 |
| **변경 감지** | 개발자 노트 등 신규 소스 유입 → NEW/CHANGED/CONFIRMED 3분류 → KB 버전 승격 + 변경 리포트. **git 히스토리가 곧 KB 버전 이력** |

실증 사례: 공식 위키 `Etheldreda` vs 팬 위키 `Etheldrena` 표기 충돌, 2020년 '이드리긴'
서사의 개편 이력, 개발 총괄 변경 이력이 실제로 자동 탐지되어 리포트에 기록되어 있습니다.

## 아키텍처

```
공개 소스 (위키·개발자 노트·보도)
      │  scripts/ingest.ts  ← 수동 트리거, 원문은 메모리에서만 처리
      ▼
/data/*.json  (zod 검증, git 버전 관리 = KB 이력)
 ├─ entities / facts / relations / foreshadowing / kb-meta
 ├─ glossary.json          ← scripts/build-glossary.ts (빌드 시 파생)
 └─ reports/               ← scripts/check.ts (C1~C5) + change-*.{json,md}
      │
      ▼
Next.js App Router
 ├─ (dashboard)/ 6개 화면: 개요·지식베이스·리포트·용어집·게이트·원장
 └─ api/gate     ← Claude API (서버 전용, 스트리밍 판정)
```

## 실행

```bash
pnpm install
echo "ANTHROPIC_API_KEY=sk-..." > .env.local   # 서버 전용, 커밋 금지
pnpm dev            # 개발 서버
pnpm build          # 검증 + 용어집 파생 + 빌드
pnpm check          # C1~C5 정합성 검사 (LLM, KB 버전별 캐시)
pnpm ingest --url <url> --label "<이름>" --tier dev-note   # 변경 감지 파이프라인
pnpm test:e2e       # Playwright 스모크 테스트
```

## 저작권·데이터 윤리

- 원문 전문을 저장하지 않습니다 — 사실만 추출해 자체 문장으로 재기술하며, 인용은
  스키마 수준에서 15단어 미만으로 강제됩니다.
- 모든 팩트·용어집 항목은 원문으로의 **링크 참조**를 보유합니다.
- UI 비주얼은 자체 디자인이며, 연대기 화면에 한해 공식 배포 채널(Steam 상점
  페이지)의 프로모션 스크린샷을 출처·저작권 표기와 함께 제한적으로 사용합니다.
- 공개 데이터만 사용합니다. 데이터마이닝·유출 자료는 다루지 않습니다.
- 권리자 요청 시 즉시 비공개로 전환합니다.

## 기술 스택

Next.js 16 (App Router) · TypeScript strict · Tailwind CSS v4 · zod ·
Claude API (claude-sonnet-4-6, 서버 라우트 전용) · d3-force (레이아웃 계산만) · Playwright
