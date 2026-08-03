import type { Fact } from "@/lib/schema";
import {
  CLAIM_TYPE_LABELS,
  CONFIDENCE_LABELS,
  FACT_STATUS_LABELS,
  SOURCE_TIER_LABELS,
} from "@/lib/labels";

const STATUS_BADGE: Record<Fact["status"], string> = {
  active: "text-verdant border-verdant/40",
  superseded: "text-parchment-dim border-ink-700",
  deprecated: "text-parchment-dim border-ink-700",
  conflicted: "text-ember border-ember/50",
};

export function FactCard({ fact }: { fact: Fact }) {
  const dimmed = fact.status === "superseded" || fact.status === "deprecated";
  return (
    <article
      className={`rounded-md border border-ink-700 bg-ink-900 px-4 py-3 ${
        fact.status === "conflicted" ? "border-l-2 border-l-ember" : ""
      } ${dimmed ? "opacity-70" : ""}`}
    >
      <header className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="eyebrow">
          {fact.id} · {fact.claim_type} · {fact.confidence}
        </span>
        <span
          className={`rounded-full border px-2 py-px text-xs ${STATUS_BADGE[fact.status]}`}
        >
          {fact.status === "conflicted" && "⚠ "}
          {FACT_STATUS_LABELS[fact.status]}
        </span>
        <span className="text-xs text-parchment-dim">
          {CLAIM_TYPE_LABELS[fact.claim_type]} · {CONFIDENCE_LABELS[fact.confidence]}
        </span>
      </header>
      <p className="text-sm leading-relaxed">{fact.statement_ko}</p>
      <p className="mt-1 text-xs text-parchment-dim">{fact.statement_en}</p>
      <footer className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
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
