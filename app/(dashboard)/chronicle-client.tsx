"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Entity } from "@/lib/schema";
import type { Chapter } from "@/lib/chronicle";
import {
  LoreParagraph,
  segmentText,
  useLoreMatcher,
  useVisitedTerms,
} from "@/components/lore-text";

export type ChapterQa = { foreshadow: number; conflicts: number };

export function ChronicleClient({
  chapters,
  qa,
  entities,
}: {
  chapters: Chapter[];
  qa: Record<string, ChapterQa>;
  entities: Entity[];
}) {
  const matcher = useLoreMatcher(entities);
  const { visited, markVisited } = useVisitedTerms();
  const [openTermKey, setOpenTermKey] = useState<string | null>(null);

  const entityById = useMemo(
    () => new Map(entities.map((e) => [e.id, e])),
    [entities]
  );

  // Pre-segment every paragraph; first occurrence per chapter becomes a link.
  const segmented = useMemo(
    () =>
      chapters.map((ch) => {
        const linkedInChapter = new Set<string>();
        return ch.paragraphs.map((p) => segmentText(p, matcher, linkedInChapter));
      }),
    [chapters, matcher]
  );

  const onToggleTerm = (key: string | null, entityId?: string) => {
    setOpenTermKey(key);
    if (key && entityId) markVisited(entityId);
  };

  return (
    <div className="mx-auto max-w-2xl">
      {chapters.map((ch, ci) => {
        const chapterQa = qa[ch.id];
        return (
          <article key={ch.id} className="mb-14 last:mb-4">
            <header className="mb-5">
              <p className="eyebrow mb-1.5">제{ch.num}장</p>
              <h2 className="font-display text-xl font-black tracking-tight">
                {ch.title}
              </h2>
            </header>
            <div className="flex flex-col gap-4">
              {segmented[ci].map((segments, pi) => (
                <LoreParagraph
                  key={pi}
                  segments={segments}
                  entityById={entityById}
                  visited={visited}
                  openTermKey={openTermKey}
                  onToggleTerm={onToggleTerm}
                  paragraphKey={`${ch.id}:${pi}`}
                />
              ))}
            </div>

            {(chapterQa.foreshadow > 0 || chapterQa.conflicts > 0) && (
              <div className="mt-5 flex flex-wrap gap-2">
                {chapterQa.foreshadow > 0 && (
                  <Link
                    href="/ledger"
                    className="rounded-full border border-rift-teal/50 bg-ink-900 px-3 py-1 text-xs text-rift-teal transition-colors hover:bg-ink-800"
                  >
                    이 대목의 미해소 복선 {chapterQa.foreshadow}건 →
                  </Link>
                )}
                {chapterQa.conflicts > 0 && (
                  <Link
                    href="/reports"
                    className="rounded-full border border-ember/50 bg-ink-900 px-3 py-1 text-xs text-ember transition-colors hover:bg-ink-800"
                  >
                    이 대목의 충돌 팩트 {chapterQa.conflicts}건 →
                  </Link>
                )}
              </div>
            )}

            {ci < chapters.length - 1 && (
              <div className="mt-12 text-center text-gilt/50" aria-hidden>
                ✦
              </div>
            )}
          </article>
        );
      })}

      <footer className="mb-6 rounded-md border border-ink-700 bg-ink-900 px-5 py-4 text-sm text-parchment-dim">
        이야기의 모든 문장은 공개 자료의 사실을 자체적으로 재기술한 것이며, 본문의
        금색 용어를 클릭하면 정의와 출처를 확인할 수 있습니다. 이 연대기 전체가{" "}
        <Link href="/dashboard" className="text-gilt underline-offset-2 hover:underline">
          정합성 검증 시스템
        </Link>
        의 감시 아래 있습니다.
      </footer>
    </div>
  );
}
