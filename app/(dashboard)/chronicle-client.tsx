"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Entity } from "@/lib/schema";
import {
  CHAPTER_IMAGES,
  CHAPTER_SOURCE_URL,
  type Chapter,
} from "@/lib/chronicle";
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
    <div className="mx-auto max-w-4xl">
      {chapters.map((ch, ci) => {
        const chapterQa = qa[ch.id];
        const image = CHAPTER_IMAGES[ch.id];
        return (
          <article key={ch.id} className="mb-14 last:mb-4">
            <header className="mb-5">
              <p className="eyebrow mb-2 flex items-center gap-3">
                <span className="text-gilt">제{ch.num}장</span>
                <span className="rule-fade flex-1" aria-hidden />
              </p>
              <h2 className="font-display text-xl font-bold">{ch.title}</h2>
            </header>

            {image && (
              <figure className="panel mb-7 overflow-hidden">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={1920}
                  height={1080}
                  sizes="(min-width: 1024px) 896px, 100vw"
                  className="h-auto w-full"
                  // Only ch.1 is above the fold; eager-loading all seven cost
                  // mobile LCP several seconds for images nobody had scrolled to.
                  priority={ci === 0}
                  loading={ci === 0 ? "eager" : "lazy"}
                />
              </figure>
            )}

            <div className="mx-auto max-w-2xl">
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
                      className="chip border-rift-teal/50 text-rift-teal hover:border-rift-teal hover:text-rift-teal"
                    >
                      이 대목의 미해소 복선 {chapterQa.foreshadow}건 →
                    </Link>
                  )}
                  {chapterQa.conflicts > 0 && (
                    <Link
                      href="/reports"
                      className="chip border-ember/50 text-ember hover:border-ember hover:text-ember"
                    >
                      이 대목의 충돌 팩트 {chapterQa.conflicts}건 →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {ci < chapters.length - 1 && (
              <div className="mt-14 flex items-center gap-4" aria-hidden>
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-ink-700" />
                <span className="text-[0.6rem] text-gilt/60">◆</span>
                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-ink-700" />
              </div>
            )}
          </article>
        );
      })}

      <footer className="mx-auto mb-6 max-w-2xl">
        <div className="panel px-5 py-4 text-sm text-parchment-dim">
          이야기의 모든 문장은 공개 자료의 사실을 자체적으로 재기술한 것이며, 본문의
          금색 용어를 클릭하면 정의와 출처를 확인할 수 있습니다. 이 연대기 전체가{" "}
          <Link href="/dashboard" className="text-gilt underline-offset-2 hover:underline">
            정합성 검증 시스템
          </Link>
          의 상시 대조를 거칩니다.
        </div>
        <p className="mt-4 text-center text-[11px] text-parchment-dim/50">
          본 페이지의 삽화는 크로노 오디세이 공식 스크린샷입니다 · ©
          Chrono Studio · Kakao Games ·{" "}
          <a
            href={CHAPTER_SOURCE_URL}
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:text-parchment-dim hover:underline"
          >
            출처
          </a>
        </p>
      </footer>
    </div>
  );
}
