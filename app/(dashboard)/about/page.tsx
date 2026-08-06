import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";

export const metadata = { title: "소개" };

// The same pipeline drawing as README.md §아키텍처, kept in sync by hand.
// It stays ASCII on purpose: this project's whole claim is that the KB is
// plain JSON under git, and a text diagram makes that claim in its own medium.
const ARCHITECTURE = `공개 소스 (위키·개발자 노트·보도)
      │  scripts/ingest.ts  ← 수동 트리거, 원문은 메모리에서만 처리
      ▼
/data/*.json  (zod 검증, git 버전 관리 = KB 이력)
 ├─ entities / facts / relations / foreshadowing / kb-meta
 ├─ glossary.json          ← scripts/build-glossary.ts (빌드 시 파생)
 └─ reports/               ← scripts/check.ts (C1~C5) + change-*.{json,md}
      │
      ▼
Next.js App Router
 ├─ (dashboard)/ 8개 화면: 연대기·지식베이스·대시보드·게이트·리포트·용어집·원장·소개
 └─ api/gate     ← Claude API (서버 전용, 스트리밍 판정)`;

const ETHICS = [
  {
    title: "원문을 저장하지 않음",
    body: "사실만 추출해 자체 문장으로 재기술하며, 인용은 스키마 수준에서 15단어 미만으로 강제됩니다.",
  },
  {
    title: "모든 항목이 출처를 보유",
    body: "팩트·용어집 항목 전부가 원문으로의 링크 참조와 소스 티어, 신뢰도 등급을 가집니다.",
  },
  {
    title: "라이선스 이원화",
    body: "코드는 MIT, data/ 디렉터리는 적용 대상에서 제외됩니다. 세계관 사실의 권리는 크로노스튜디오·카카오게임즈에 있습니다.",
  },
  {
    title: "공개 데이터만 사용",
    body: "데이터마이닝·유출 자료는 다루지 않습니다. 이미지는 연대기 화면에 한해 공식 배포 채널의 프로모션 스크린샷을 출처 표기와 함께 제한적으로 사용합니다.",
  },
  {
    title: "권리자 우선",
    body: "권리자 요청 시 즉시 비공개로 전환합니다.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        className="mb-10"
        eyebrow="PORTFOLIO · 프로젝트 기록"
        title="이 프로젝트에 대하여"
        lede="Lore Guard가 왜, 어떻게, 얼마의 비용으로 만들어졌는지에 대한 기록입니다."
      />

      <section aria-label="만든 이유" className="mb-10">
        <SectionHeading>왜 만들었나</SectionHeading>
        <div className="panel p-6 text-sm leading-[1.85] text-parchment-dim">
          <p>
            방대한 세계관을 다루는 소규모 내러티브 팀에서 표기 불일치, 연표
            충돌, 번역 비일관, 설정 모순을 검증하는 유일한 도구는{" "}
            <b className="text-parchment">리드 작가의 기억</b>입니다. 인력
            규모가 작을수록 이 단일 장애점의 리스크는 커집니다.
          </p>
          <p className="mt-3">
            Lore Guard는 그 기억을 출처 링크가 달린 지식베이스로 외부화하고,
            코드에 CI가 있듯 내러티브에 CI를 답니다. 신규 텍스트는 게이트에서
            판정받고, 신규 소스는 변경 감지를 거치며, 모든 변경은 git 이력으로
            남습니다.
          </p>
        </div>
      </section>

      <section aria-label="아키텍처" className="mb-10">
        <SectionHeading aside="README §아키텍처">아키텍처</SectionHeading>
        <div className="panel overflow-x-auto p-6">
          <pre className="font-mono text-xs leading-relaxed text-parchment-dim">
            {ARCHITECTURE}
          </pre>
        </div>
      </section>

      <section aria-label="데이터 윤리" className="mb-10">
        <SectionHeading>데이터 윤리 원칙</SectionHeading>
        <ul className="grid gap-3">
          {ETHICS.map((e) => (
            <li key={e.title} className="panel px-5 py-4">
              <p className="text-sm font-bold text-parchment">{e.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-parchment-dim">
                {e.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="구축 기간과 비용" className="mb-10">
        <SectionHeading>구축 기간과 비용</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="panel px-5 py-5">
            <p className="eyebrow mb-2">구축 기간</p>
            <p className="readout text-2xl font-bold text-parchment">4일</p>
            <p className="mt-2 text-xs leading-relaxed text-parchment-dim">
              사전 조사 2026-07-31, 구현 2026-08-03 ~ 2026-08-06. PRD와 지침서
              작성 후 Claude Code와 함께 구축했습니다.
            </p>
          </div>
          <div className="panel px-5 py-5">
            <p className="eyebrow mb-2">총 API 비용 (실측)</p>
            <p className="readout text-2xl font-bold text-gilt">약 $200</p>
            <p className="mt-2 text-xs leading-relaxed text-parchment-dim">
              전체 구축 세션의 토큰 사용량 실측치(2026-08-06 집계)를 API 정가로
              환산한 값입니다. 총 처리 약 1.7억 토큰, 그중 캐시 읽기가 약
              1.69억 토큰, 모델 출력이 약 90만 토큰입니다. 앱 자체의 판정
              호출(C1~C5 검사·게이트)은 규칙 기반 후보 선별과 KB 버전별 캐시로
              비용을 억제합니다.
            </p>
          </div>
        </div>
      </section>

      <section aria-label="저장소">
        <SectionHeading>저장소</SectionHeading>
        <a
          href="https://github.com/Yegeon99/Chrono-Story"
          target="_blank"
          rel="noreferrer"
          className="panel panel-hover plate-marks group block p-6"
        >
          <p className="eyebrow mb-2">GITHUB · 코드와 KB 이력 전체 공개</p>
          <h2 className="font-display text-xl font-bold text-gilt">
            Yegeon99/Chrono-Story
          </h2>
          <p className="mt-2 text-sm text-parchment-dim">
            스키마, 검사 엔진, 수집 파이프라인, 그리고 KB의 모든 버전 이력을
            저장소에서 확인할 수 있습니다.
          </p>
          <p className="mt-3 text-xs text-gilt opacity-70 transition-opacity group-hover:opacity-100">
            저장소 열기 ↗
          </p>
        </a>
      </section>
    </div>
  );
}
