"use client";

import { useState } from "react";
import type { Fact, Foreshadowing } from "@/lib/schema";
import { FactCard } from "@/components/fact-card";

const COLUMNS: {
  status: Foreshadowing["status"];
  label: string;
  accent: string;
}[] = [
  { status: "unresolved", label: "미해소", accent: "text-parchment" },
  { status: "resurfaced", label: "재부상", accent: "text-rift-teal" },
  { status: "resolved", label: "회수됨", accent: "text-verdant" },
  { status: "abandoned", label: "폐기 추정", accent: "text-parchment-dim" },
];

export function LedgerBoard({
  items,
  facts,
}: {
  items: Foreshadowing[];
  facts: Fact[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find((f) => f.id === selectedId);
  const factById = new Map(facts.map((f) => [f.id, f]));

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const colItems = items.filter((f) => f.status === col.status);
          return (
            <section
              key={col.status}
              aria-label={col.label}
              className="panel bg-ink-900/60"
            >
              <header className="border-b border-ink-700 px-3 py-2">
                <span className={`text-sm font-medium ${col.accent}`}>
                  {col.label}
                </span>
                <span className="eyebrow ml-2">{colItems.length}</span>
              </header>
              <ul className="flex flex-col gap-2 p-2">
                {colItems.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedId(selectedId === f.id ? null : f.id)
                      }
                      aria-pressed={selectedId === f.id}
                      className={`w-full rounded-md border bg-ink-900 px-3 py-2.5 text-left transition-colors hover:border-gilt/40 ${
                        selectedId === f.id
                          ? "border-gilt/60"
                          : f.status === "resurfaced"
                            ? "border-rift-teal/50"
                            : "border-ink-700"
                      }`}
                    >
                      <span className="eyebrow block">{f.id}</span>
                      <span className="mt-0.5 block text-sm">{f.title_ko}</span>
                    </button>
                  </li>
                ))}
                {colItems.length === 0 && (
                  <li className="px-3 py-6 text-center text-xs text-parchment-dim">
                    항목 없음
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>

      {selected && (
        <section aria-label="복선 상세" className="panel mt-6 p-5">
          <header className="mb-3">
            <p className="eyebrow mb-1">
              {selected.id} ·{" "}
              {COLUMNS.find((c) => c.status === selected.status)?.label}
            </p>
            <h2 className="font-display text-lg font-bold">{selected.title_ko}</h2>
            <p className="mt-2 max-w-2xl text-sm text-parchment-dim">
              {selected.summary_ko}
            </p>
          </header>

          <h3 className="eyebrow mb-2">이력 타임라인</h3>
          <ol className="mb-5 border-l border-ink-700 pl-4">
            {selected.history.map((h, i) => (
              <li key={i} className="relative mb-3 last:mb-0">
                <span
                  className="absolute -left-[1.35rem] top-1.5 h-2 w-2 rounded-full bg-rift-teal"
                  aria-hidden
                />
                <p className="font-mono text-xs text-parchment-dim">{h.date}</p>
                <p className="text-sm">{h.event}</p>
                {h.source_url && (
                  <a
                    href={h.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-rift-teal underline-offset-2 hover:underline"
                  >
                    출처 ↗
                  </a>
                )}
              </li>
            ))}
          </ol>

          {selected.linked_fact_ids.length > 0 && (
            <>
              <h3 className="eyebrow mb-2">
                연결된 팩트 {selected.linked_fact_ids.length}
              </h3>
              <div className="flex flex-col gap-2">
                {selected.linked_fact_ids.map((id) => {
                  const f = factById.get(id);
                  return f ? <FactCard key={id} fact={f} /> : null;
                })}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
