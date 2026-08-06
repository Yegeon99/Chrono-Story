import { loadFacts, loadKbMeta, loadReports } from "@/lib/kb";
import { PageHeader } from "@/components/page-header";
import { ReportList } from "./report-list";

export const metadata = { title: "검사 리포트" };

export default function ReportsPage() {
  const meta = loadKbMeta();
  const reports = loadReports();
  const facts = loadFacts();

  // One report set per KB version, newest first. The default view and every
  // headline count are the current version's; older sets stay reachable as
  // history through the version picker, never summed into the headline.
  const versions = [...new Set(reports.map((r) => r.kb_version))].sort((a, b) =>
    b.localeCompare(a)
  );
  const latest = reports.filter((r) => r.kb_version === meta.kb_version);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        className="mb-8"
        eyebrow={`KB ${meta.kb_version} · 검사 항목 ${latest.length}건`}
        title="정합성 검사 리포트"
        lede="연표 충돌(C1)·설정 모순(C2)·표기 일관성(C3)·톤 위반(C4)·미해소 복선(C5) 5종 검사 결과입니다. 모든 판정은 근거 팩트를 인용합니다."
      />
      {reports.length === 0 ? (
        <div className="rounded-md border border-dashed border-ink-700 px-6 py-16 text-center text-sm text-parchment-dim">
          이 KB 버전에 대한 검사 결과가 아직 없습니다. 정합성 검사가 실행되면
          결과가 여기에 기록됩니다.
        </div>
      ) : (
        <ReportList
          reports={reports}
          facts={facts}
          versions={versions}
          currentVersion={meta.kb_version}
        />
      )}
    </div>
  );
}
