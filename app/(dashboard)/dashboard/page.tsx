import Link from "next/link";
import {
  loadEntities,
  loadFacts,
  loadRelations,
  loadForeshadowing,
  loadKbMeta,
  loadChangeReports,
  loadReports,
} from "@/lib/kb";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";

export const metadata = { title: "QA 대시보드" };

export default function DashboardPage() {
  const meta = loadKbMeta();
  const entities = loadEntities();
  const facts = loadFacts();
  const relations = loadRelations();
  const foreshadowing = loadForeshadowing();
  const changeReports = loadChangeReports();
  const checkReports = loadReports();

  const conflicted = facts.filter((f) => f.status === "conflicted").length;
  const unresolved = foreshadowing.filter(
    (f) => f.status === "unresolved" || f.status === "resurfaced"
  ).length;
  const resurfaced = foreshadowing.filter((f) => f.status === "resurfaced");
  const latestChange = changeReports[0];

  const stats = [
    { label: "엔티티", value: entities.length },
    { label: "팩트", value: facts.length },
    { label: "관계", value: relations.length },
    { label: "검사 발견", value: checkReports.length, accent: "text-amber-warn" },
    { label: "표기·설정 충돌", value: conflicted, accent: "text-ember" },
    { label: "미해소 복선", value: unresolved, accent: "text-rift-teal" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        className="mb-10"
        eyebrow={`KB ${meta.kb_version} · 갱신 ${meta.updated_at}`}
        title="QA 대시보드"
        lede="지식베이스의 정합성 현황입니다. 모든 팩트는 출처 링크와 신뢰도를 보유하며, 모든 변경은 git 이력으로 남습니다."
      />

      <section aria-label="핵심 기능" className="mb-10">
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/gate"
            className="panel panel-hover plate-marks group border-gilt/40 p-6"
          >
            <p className="eyebrow mb-2">NARRATIVE CI · 라이브 데모</p>
            <h2 className="font-display text-xl font-bold text-gilt">
              검증 게이트
            </h2>
            <p className="mt-2 text-sm text-parchment-dim">
              신규 대사를 붙여넣으면 지식베이스와 대조해 30초 내
              PASS / WARN / FAIL 인장을 찍습니다. 데모 시나리오 3종 제공.
            </p>
            <p className="mt-3 text-xs text-gilt opacity-70 transition-opacity group-hover:opacity-100">
              판정하러 가기 →
            </p>
          </Link>
          <Link href="/reports" className="panel panel-hover group p-6">
            <p className="eyebrow mb-2">C1~C5 · 5종 정합성 검사</p>
            <h2 className="font-display text-xl font-bold">검사 리포트</h2>
            <p className="mt-2 text-sm text-parchment-dim">
              연표·설정·표기·톤·복선 검사가 탐지한{" "}
              <b className="text-amber-warn">{checkReports.length}건</b>의 발견
              — 실존 표기 충돌과 설정 개편 이력이 근거 팩트와 함께 기록되어
              있습니다.
            </p>
            <p className="mt-3 text-xs text-amber-warn opacity-70 transition-opacity group-hover:opacity-100">
              리포트 보기 →
            </p>
          </Link>
        </div>
      </section>

      <section aria-label="지식베이스 통계" className="mb-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label} className="panel panel-hover px-4 py-5">
              <div
                className={`readout text-2xl font-bold ${s.accent ?? "text-parchment"}`}
              >
                {s.value}
              </div>
              <div className="mt-1.5 text-xs text-parchment-dim">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {latestChange && (
        <section aria-label="최근 변경 감지" className="mb-10">
          <SectionHeading
            aside={`KB ${latestChange.previous_version} → ${latestChange.kb_version}`}
          >
            최근 변경 감지
          </SectionHeading>
          <div className="panel px-5 py-4">
            <p className="eyebrow mb-1">
              KB {latestChange.previous_version} → {latestChange.kb_version} ·{" "}
              {latestChange.created_at.slice(0, 10)}
            </p>
            <p className="text-sm">{latestChange.summary_ko}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-parchment-dim">
              <span>
                신규 <b className="text-verdant">{latestChange.new_fact_ids.length}</b>
              </span>
              <span>
                변경 <b className="text-amber-warn">{latestChange.changed.length}</b>
              </span>
              <span>
                재확인{" "}
                <b className="text-parchment">
                  {latestChange.confirmed_fact_ids.length}
                </b>
              </span>
              <span>
                재부상 복선{" "}
                <b className="text-rift-teal">
                  {latestChange.resurfaced_foreshadowing_ids.length}
                </b>
              </span>
              <a
                href={latestChange.source.url}
                target="_blank"
                rel="noreferrer"
                className="text-rift-teal underline-offset-2 hover:underline"
              >
                소스: {latestChange.source.label} ↗
              </a>
            </div>
          </div>
        </section>
      )}

      {resurfaced.length > 0 && (
        <section aria-label="재부상한 복선" className="mb-10">
          <SectionHeading accent="text-rift-teal" aside={`${resurfaced.length}건`}>
            재부상한 복선
          </SectionHeading>
          <ul className="flex flex-col gap-2">
            {resurfaced.map((f) => (
              <li key={f.id}>
                <Link
                  href="/ledger"
                  className="panel panel-hover block border-rift-teal/40 px-4 py-3"
                >
                  <span className="eyebrow">{f.id}</span>
                  <span className="mt-0.5 block text-sm">{f.title_ko}</span>
                  <span className="mt-1 block text-xs text-parchment-dim">
                    {f.history[f.history.length - 1]?.event.slice(0, 120)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="등록된 소스">
        <SectionHeading aside={`${meta.source_registry.length}개 등록`}>
          소스 레지스트리
        </SectionHeading>
        <ul className="panel divide-y divide-ink-700">
          {meta.source_registry.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-ink-800/40"
            >
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-parchment underline-offset-4 hover:underline"
              >
                {s.label}
              </a>
              <span className="eyebrow">{s.tier}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
