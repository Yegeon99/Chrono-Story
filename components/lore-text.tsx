"use client";

// Auto-linking lore text: scans prose against entities.json (name_ko / name_en /
// aliases — nothing hardcoded) and turns matches into clickable terms with a
// definition popover. First occurrence per chapter is linked; visited terms are
// visually distinguished and persisted in localStorage.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Entity } from "@/lib/schema";
import { ENTITY_TYPE_LABELS } from "@/lib/labels";

const VISITED_KEY = "loreguard-visited-terms";

type Segment =
  | { kind: "text"; content: string }
  | { kind: "term"; content: string; entityId: string };

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function useLoreMatcher(entities: Entity[]) {
  return useMemo(() => {
    const items = entities
      .flatMap((e) =>
        [e.name_ko, e.name_en, ...e.aliases]
          .filter((n) => n.trim().length >= 2)
          .map((term) => ({ term, id: e.id }))
      )
      .sort((a, b) => b.term.length - a.term.length);
    const pattern = new RegExp(
      items.map((i) => escapeRegex(i.term)).join("|"),
      "gi"
    );
    const termToId = new Map(items.map((i) => [i.term.toLowerCase(), i.id]));
    return { pattern, termToId };
  }, [entities]);
}

/** Splits a paragraph into text/term segments. `linkedInScope` dedupes links
 *  across a chapter — only the first occurrence of an entity becomes a term. */
export function segmentText(
  text: string,
  matcher: ReturnType<typeof useLoreMatcher>,
  linkedInScope: Set<string>
): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  matcher.pattern.lastIndex = 0;
  for (const m of text.matchAll(matcher.pattern)) {
    const entityId = matcher.termToId.get(m[0].toLowerCase());
    if (!entityId || linkedInScope.has(entityId)) continue;
    linkedInScope.add(entityId);
    if (m.index! > last) segments.push({ kind: "text", content: text.slice(last, m.index) });
    segments.push({ kind: "term", content: m[0], entityId });
    last = m.index! + m[0].length;
  }
  if (last < text.length) segments.push({ kind: "text", content: text.slice(last) });
  return segments;
}

export function useVisitedTerms() {
  const [visited, setVisited] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(VISITED_KEY);
      if (raw) setVisited(new Set(JSON.parse(raw)));
    } catch {
      // ignore corrupt storage
    }
  }, []);

  const markVisited = (id: string) => {
    setVisited((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(VISITED_KEY, JSON.stringify([...next]));
      } catch {
        // storage full/blocked — visual state still works for the session
      }
      return next;
    });
  };

  return { visited, markVisited };
}

export function LoreParagraph({
  segments,
  entityById,
  visited,
  openTermKey,
  onToggleTerm,
  paragraphKey,
}: {
  segments: Segment[];
  entityById: Map<string, Entity>;
  visited: Set<string>;
  openTermKey: string | null;
  onToggleTerm: (key: string | null, entityId?: string) => void;
  paragraphKey: string;
}) {
  return (
    <p className="text-[0.95rem] leading-[1.85] text-parchment">
      {segments.map((seg, i) => {
        if (seg.kind === "text") return <span key={i}>{seg.content}</span>;
        const key = `${paragraphKey}:${i}`;
        const entity = entityById.get(seg.entityId);
        const isOpen = openTermKey === key;
        const isVisited = visited.has(seg.entityId);
        return (
          <span key={i} className="relative inline-block">
            <button
              type="button"
              onClick={() => onToggleTerm(isOpen ? null : key, seg.entityId)}
              aria-expanded={isOpen}
              className={`rounded-sm underline decoration-1 underline-offset-4 transition-colors ${
                isVisited
                  ? "text-parchment-dim decoration-dotted decoration-parchment-dim/60 hover:text-parchment"
                  : "text-gilt decoration-gilt/50 hover:decoration-gilt"
              }`}
            >
              {seg.content}
            </button>
            {isOpen && entity && (
              <span
                role="dialog"
                aria-label={`${entity.name_ko} 정의`}
                className="absolute left-0 top-full z-20 mt-1.5 block w-72 rounded-md border border-ink-700 bg-ink-950 p-3.5 text-left shadow-xl shadow-black/40"
              >
                <span className="eyebrow block">
                  {ENTITY_TYPE_LABELS[entity.type]} · {entity.id}
                </span>
                <span className="mt-1 block font-display text-sm font-bold text-parchment">
                  {entity.name_ko}
                  <span className="ml-2 font-mono text-xs font-normal text-parchment-dim">
                    {entity.name_en}
                  </span>
                </span>
                {entity.aliases.length > 0 && (
                  <span className="mt-0.5 block text-xs text-amber-warn">
                    표기 변형: {entity.aliases.join(", ")}
                  </span>
                )}
                <span className="mt-1.5 block text-xs leading-relaxed text-parchment-dim">
                  {entity.summary_ko}
                </span>
                <Link
                  href={`/knowledge?entity=${entity.id}`}
                  className="mt-2.5 inline-block text-xs text-rift-teal underline-offset-2 hover:underline"
                >
                  지식베이스에서 보기 →
                </Link>
              </span>
            )}
          </span>
        );
      })}
    </p>
  );
}
