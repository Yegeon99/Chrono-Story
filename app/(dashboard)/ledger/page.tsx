import { loadFacts, loadForeshadowing, loadKbMeta } from "@/lib/kb";
import { PageHeader } from "@/components/page-header";
import { LedgerBoard } from "./ledger-board";

export const metadata = { title: "복선 원장" };

export default function LedgerPage() {
  const meta = loadKbMeta();
  const items = loadForeshadowing();
  const facts = loadFacts();
  const open = items.filter(
    (f) => f.status === "unresolved" || f.status === "resurfaced"
  ).length;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        className="mb-8"
        eyebrow={`KB ${meta.kb_version} · 총 ${items.length}건 · 미회수 ${open}건`}
        title="복선 원장"
        lede="언급됐으나 회수되지 않은 설정을 자산으로 축적합니다. 신규 소스가 유입되면 재부상 여부를 자동 탐지하며, 항목을 클릭하면 이력 타임라인이 표시됩니다."
      />
      <LedgerBoard items={items} facts={facts} />
    </div>
  );
}
