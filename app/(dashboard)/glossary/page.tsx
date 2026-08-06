import { loadGlossary, loadKbMeta } from "@/lib/kb";
import { PageHeader } from "@/components/page-header";
import { GlossaryTable } from "./glossary-table";

export const metadata = { title: "용어집" };

export default function GlossaryPage() {
  const meta = loadKbMeta();
  const entries = loadGlossary();
  const conflicts = entries.filter((e) => e.conflict).length;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        className="mb-8"
        eyebrow={`KB ${meta.kb_version} · 용어 ${entries.length} · 표기 충돌 ${conflicts}`}
        title="한영 용어집"
        lede="지식베이스의 표기 팩트에서 자동 편찬됩니다. 충돌 표기는 숨기지 않고 병기하며, 모든 항목은 출처 링크를 보유합니다."
      />
      <GlossaryTable entries={entries} />
    </div>
  );
}
