import { loadFacts, loadKbMeta, loadReports } from "@/lib/kb";
import { ReportList } from "./report-list";

export const metadata = { title: "검사 리포트" };

export default function ReportsPage() {
  const meta = loadKbMeta();
  const reports = loadReports();
  const facts = loadFacts();

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <p className="eyebrow mb-2">
          KB {meta.kb_version} · 검사 항목 {reports.length}건
        </p>
        <h1 className="font-display text-2xl font-black tracking-tight">
          정합성 검사 리포트
        </h1>
        <p className="mt-3 max-w-xl text-sm text-parchment-dim">
          연표 충돌(C1)·설정 모순(C2)·표기 일관성(C3)·톤 위반(C4)·미해소
          복선(C5) 5종 검사 결과입니다. 모든 판정은 근거 팩트를 인용합니다.
        </p>
      </header>
      {reports.length === 0 ? (
        <div className="rounded-md border border-dashed border-ink-700 px-6 py-16 text-center text-sm text-parchment-dim">
          아직 검사 결과가 없습니다. <code className="font-mono">pnpm check</code>를
          실행하세요.
        </div>
      ) : (
        <ReportList reports={reports} facts={facts} />
      )}
    </div>
  );
}
