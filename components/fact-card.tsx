import type { Fact } from "@/lib/schema";
import {
  CLAIM_TYPE_LABELS,
  CONFIDENCE_LABELS,
  FACT_STATUS_LABELS,
  SOURCE_TIER_LABELS,
} from "@/lib/labels";

const STATUS_BADGE: Record<Fact["status"], string> = {
  active: "text-verdant border-verdant/40 bg-verdant/5",
  superseded: "text-parchment-dim border-ink-700 bg-ink-800/50",
  deprecated: "text-parchment-dim border-ink-700 bg-ink-800/50",
  conflicted: "text-ember border-ember/50 bg-ember/8",
};

export function FactCard({ fact }: { fact: Fact }) {
  const dimmed = fact.status === "superseded" || fact.status === "deprecated";
  return (
    <article
      className={`panel px-4 py-3.5 ${
        fact.status === "conflicted" ? "border-l-2 border-l-ember" : ""
      } ${dimmed ? "opacity-70" : ""}`}
    >
      <header className="mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        {/* The fact's identity, not decoration (DIRECTIVE §5 구조 장치). */}
        <span className="eyebrow text-gilt/85">{fact.id}</span>
        <span className="eyebrow text-parchment-faint" aria-hidden>
          ·
        </span>
        <span className="eyebrow">
          {CLAIM_TYPE_LABELS[fact.claim_type]} ·{" "}
          {CONFIDENCE_LABELS[fact.confidence]}
        </span>
        <span
          className={`ml-auto rounded-full border px-2 py-px text-xs ${STATUS_BADGE[fact.status]}`}
        >
          {fact.status === "conflicted" && "⚠ "}
          {FACT_STATUS_LABELS[fact.status]}
        </span>
      </header>
      <p className="text-sm leading-[1.8]">{fact.statement_ko}</p>
      <p className="allow-break mt-1 text-xs leading-relaxed text-parchment-dim">
        {fact.statement_en}
      </p>
      <footer className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink-700/60 pt-2.5">
        {fact.sources.map((s) => (
          <a
            key={s.url}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-rift-teal underline-offset-2 hover:underline"
          >
            {SOURCE_TIER_LABELS[s.source_tier]} ↗
          </a>
        ))}
        {fact.superseded_by && (
          <span className="text-xs text-parchment-dim">
            → 후속 팩트 {fact.superseded_by}
          </span>
        )}
      </footer>
    </article>
  );
}
