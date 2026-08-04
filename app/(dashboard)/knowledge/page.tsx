import { loadEntities, loadFacts, loadRelations } from "@/lib/kb";
import { PageHeader } from "@/components/page-header";
import { KnowledgeExplorer } from "./explorer";

export const metadata = { title: "지식베이스" };

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string }>;
}) {
  const { entity } = await searchParams;
  const entities = loadEntities();
  const facts = loadFacts();
  const relations = loadRelations();
  const initialSelectedId =
    entity && entities.some((e) => e.id === entity) ? entity : null;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        className="mb-8"
        eyebrow={`엔티티 ${entities.length} · 팩트 ${facts.length} · 관계 ${relations.length}`}
        title="지식베이스 탐색"
        lede="공개 소스에서 추출·재기술한 세계관 팩트를 엔티티 단위로 탐색합니다. 충돌 상태의 팩트는 붉은 테두리로 표시됩니다."
      />
      <KnowledgeExplorer
        entities={entities}
        facts={facts}
        relations={relations}
        initialSelectedId={initialSelectedId}
      />
    </div>
  );
}
