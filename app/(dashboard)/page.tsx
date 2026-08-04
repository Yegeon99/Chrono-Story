import { loadEntities, loadFacts, loadForeshadowing, loadKbMeta } from "@/lib/kb";
import { CHAPTERS } from "@/lib/chronicle";
import { PageHeader } from "@/components/page-header";
import { ChronicleClient, type ChapterQa } from "./chronicle-client";

export const metadata = { title: "연대기" };

export default function ChroniclePage() {
  const meta = loadKbMeta();
  const entities = loadEntities();
  const facts = loadFacts();
  const foreshadowing = loadForeshadowing();

  // Per-chapter QA weave: unresolved foreshadowing + conflicted facts
  // touching the chapter's entities (the story doubles as a QA entry point).
  const qa: Record<string, ChapterQa> = {};
  for (const ch of CHAPTERS) {
    const chEntityIds = new Set(ch.entity_ids);
    const chFacts = facts.filter((f) =>
      f.entity_ids.some((id) => chEntityIds.has(id))
    );
    const chFactIds = new Set(chFacts.map((f) => f.id));
    qa[ch.id] = {
      conflicts: chFacts.filter((f) => f.status === "conflicted").length,
      foreshadow: foreshadowing.filter(
        (fs) =>
          (fs.status === "unresolved" || fs.status === "resurfaced") &&
          fs.linked_fact_ids.some((id) => chFactIds.has(id))
      ).length,
    };
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        center
        size="lg"
        className="mb-12"
        eyebrow={`CHRONO ODYSSEY · KB ${meta.kb_version} 기준`}
        title="연대기"
        lede={
          <>
            열두 세계의 창조부터 1년 회귀까지 — 크로노 오디세이의 이야기를
            일곱 개의 장으로 담았습니다.{" "}
            <span className="text-gilt">금색 용어</span>를 클릭하면 정의가
            열리고, 각 장 말미의 칩은 그 대목에 얽힌 검증 이슈로 이어집니다.
          </>
        }
      />
      <ChronicleClient chapters={CHAPTERS} qa={qa} entities={entities} />
    </div>
  );
}
