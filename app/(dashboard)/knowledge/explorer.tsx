"use client";

import { useMemo, useState } from "react";
import type { Entity, Fact, Relation } from "@/lib/schema";
import {
  ENTITY_TYPE_LABELS,
  RELATION_TYPE_LABELS,
} from "@/lib/labels";
import { INTRO_STEPS } from "@/lib/intro-path";
import { FactCard } from "@/components/fact-card";
import { RelationGraph } from "./relation-graph";

const TYPE_ORDER = [
  "character",
  "faction",
  "planet",
  "concept",
  "artifact",
  "location",
  "creature",
  "event",
] as const;

export function KnowledgeExplorer({
  entities,
  facts,
  relations,
  initialSelectedId = null,
}: {
  entities: Entity[];
  facts: Fact[];
  relations: Relation[];
  initialSelectedId?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  // Mobile fallback needs no JS: in graph view the graph is `hidden md:block`
  // and the list is `md:hidden`, so small screens always get the list.
  const [view, setView] = useState<"graph" | "list">("graph");
  const [introOpen, setIntroOpen] = useState(false);
  const [introStep, setIntroStep] = useState(0);

  const entityById = useMemo(
    () => new Map(entities.map((e) => [e.id, e])),
    [entities]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entities
      .filter((e) => (typeFilter ? e.type === typeFilter : true))
      .filter((e) =>
        q
          ? e.name_ko.toLowerCase().includes(q) ||
            e.name_en.toLowerCase().includes(q) ||
            e.aliases.some((a) => a.toLowerCase().includes(q))
          : true
      )
      .sort(
        (a, b) =>
          TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) ||
          a.name_ko.localeCompare(b.name_ko, "ko")
      );
  }, [entities, query, typeFilter]);

  const selected = selectedId ? entityById.get(selectedId) : undefined;
  const step = INTRO_STEPS[introStep];

  return (
    <div>
      {/* ---- controls ------------------------------------------------- */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="보기 전환"
          className="hidden rounded-md border border-ink-700 p-0.5 md:flex"
        >
          {(
            [
              { id: "graph", label: "관계망 그래프" },
              { id: "list", label: "리스트" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={view === t.id}
              onClick={() => setView(t.id)}
              className={`rounded px-3 py-1.5 text-xs transition-colors ${
                view === t.id
                  ? "bg-ink-800 text-gilt"
                  : "text-parchment-dim hover:text-parchment"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIntroOpen(!introOpen)}
          aria-expanded={introOpen}
          className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
            introOpen
              ? "border-rift-teal/60 bg-ink-800 text-rift-teal"
              : "border-ink-700 text-parchment-dim hover:text-parchment"
          }`}
        >
          ✦ 처음이신가요? 세계관 입문 경로
        </button>
      </div>

      {/* ---- intro path (secondary to QA — an on-ramp, not the product) */}
      {introOpen && (
        <section
          aria-label="세계관 입문 경로"
          className="mb-5 rounded-md border border-rift-teal/40 bg-ink-900 px-5 py-4"
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {INTRO_STEPS.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIntroStep(i)}
                aria-current={introStep === i ? "step" : undefined}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  introStep === i
                    ? "border-rift-teal bg-ink-800 text-rift-teal"
                    : "border-ink-700 text-parchment-dim hover:text-parchment"
                }`}
              >
                {i + 1}. {s.title.split(" — ")[0]}
              </button>
            ))}
          </div>
          <h3 className="font-display text-base font-bold">{step.title}</h3>
          <p className="mt-1.5 max-w-3xl text-sm text-parchment-dim">
            {step.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {step.entity_ids
              .map((id) => entityById.get(id))
              .filter((e): e is Entity => !!e)
              .map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSelectedId(e.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    selectedId === e.id
                      ? "border-gilt/60 bg-ink-800 text-gilt"
                      : "border-ink-700 bg-ink-950/50 hover:border-gilt/40"
                  }`}
                >
                  {e.name_ko}
                  <span className="ml-1.5 text-parchment-dim">
                    {ENTITY_TYPE_LABELS[e.type]}
                  </span>
                </button>
              ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={introStep === 0}
              onClick={() => setIntroStep(introStep - 1)}
              className="rounded-md border border-ink-700 px-3 py-1 text-xs text-parchment-dim transition-colors hover:text-parchment disabled:opacity-40"
            >
              ← 이전
            </button>
            {introStep < INTRO_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setIntroStep(introStep + 1)}
                className="rounded-md border border-rift-teal/50 px-3 py-1 text-xs text-rift-teal transition-colors hover:bg-ink-800"
              >
                다음 →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIntroOpen(false)}
                className="rounded-md border border-rift-teal/50 px-3 py-1 text-xs text-rift-teal transition-colors hover:bg-ink-800"
              >
                입문 완료 — 자유롭게 탐색하기
              </button>
            )}
          </div>
        </section>
      )}

      {/* ---- graph view ------------------------------------------------ */}
      {view === "graph" && (
        <div className="hidden md:block">
          <RelationGraph
            entities={entities}
            relations={relations}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <div className="mt-5">
            <EntityDetail
              selected={selected}
              facts={facts}
              relations={relations}
              entityById={entityById}
              onSelect={setSelectedId}
              placeholder="그래프에서 노드를 클릭하면 팩트와 관계가 표시됩니다."
            />
          </div>
        </div>
      )}

      {/* ---- list view (always the mobile fallback for the graph) ------ */}
      {(
        <div className={view === "graph" ? "md:hidden" : ""}>
          <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
            <section aria-label="엔티티 목록">
              <div className="mb-3 flex flex-col gap-2">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="이름·영문·별칭 검색"
                  aria-label="엔티티 검색"
                  className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm placeholder:text-parchment-dim/60"
                />
                <div className="flex flex-wrap gap-1.5">
                  <FilterChip
                    label="전체"
                    active={typeFilter === null}
                    onClick={() => setTypeFilter(null)}
                  />
                  {TYPE_ORDER.map((t) => (
                    <FilterChip
                      key={t}
                      label={ENTITY_TYPE_LABELS[t]}
                      active={typeFilter === t}
                      onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                    />
                  ))}
                </div>
              </div>
              <p className="eyebrow mb-2">{filtered.length}개 엔티티</p>
              <ul className="panel max-h-[60vh] divide-y divide-ink-700 overflow-y-auto lg:max-h-[calc(100vh-320px)]">
                {filtered.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(e.id)}
                      aria-pressed={selectedId === e.id}
                      className={`flex w-full items-baseline justify-between gap-2 px-4 py-2.5 text-left transition-colors hover:bg-ink-800 ${
                        selectedId === e.id ? "bg-ink-800" : ""
                      }`}
                    >
                      <span className="min-w-0">
                        <span
                          className={`text-sm ${e.status === "deprecated" ? "text-parchment-dim" : ""}`}
                        >
                          {e.name_ko}
                        </span>
                        <span className="ml-2 text-xs text-parchment-dim">
                          {e.name_en}
                        </span>
                      </span>
                      <span className="eyebrow shrink-0">
                        {ENTITY_TYPE_LABELS[e.type]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <EntityDetail
              selected={selected}
              facts={facts}
              relations={relations}
              entityById={entityById}
              onSelect={setSelectedId}
              placeholder="왼쪽 목록에서 엔티티를 선택하면 팩트와 관계가 표시됩니다."
            />
          </div>
        </div>
      )}
    </div>
  );
}

function EntityDetail({
  selected,
  facts,
  relations,
  entityById,
  onSelect,
  placeholder,
}: {
  selected: Entity | undefined;
  facts: Fact[];
  relations: Relation[];
  entityById: Map<string, Entity>;
  onSelect: (id: string) => void;
  placeholder: string;
}) {
  if (!selected) {
    return (
      <section aria-label="엔티티 상세" aria-live="polite">
        <div className="rounded-md border border-dashed border-ink-700 px-6 py-12 text-center text-sm text-parchment-dim">
          {placeholder}
        </div>
      </section>
    );
  }

  const selectedFacts = facts.filter((f) => f.entity_ids.includes(selected.id));
  const selectedRelations = relations.filter(
    (r) => r.from === selected.id || r.to === selected.id
  );

  return (
    <section aria-label="엔티티 상세" aria-live="polite">
      <header className="mb-4">
        <p className="eyebrow mb-1">
          {selected.id} · {selected.type}
          {selected.status === "deprecated" && " · deprecated"}
        </p>
        <h2 className="font-display text-xl font-bold">
          {selected.name_ko}
          <span className="ml-3 text-base font-normal text-parchment-dim">
            {selected.name_en}
          </span>
        </h2>
        {selected.aliases.length > 0 && (
          <p className="mt-1 text-xs text-amber-warn">
            표기 변형: {selected.aliases.join(", ")}
          </p>
        )}
        <p className="mt-2 max-w-2xl text-sm text-parchment-dim">
          {selected.summary_ko}
        </p>
      </header>

      {selectedRelations.length > 0 && (
        <div className="mb-5">
          <h3 className="eyebrow mb-2">관계 {selectedRelations.length}</h3>
          <ul className="flex flex-wrap gap-1.5">
            {selectedRelations.map((r) => {
              const other =
                r.from === selected.id
                  ? entityById.get(r.to)
                  : entityById.get(r.from);
              const outgoing = r.from === selected.id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => other && onSelect(other.id)}
                    className="rounded-full border border-ink-700 bg-ink-900 px-3 py-1 text-xs transition-colors hover:border-gilt/50"
                  >
                    <span className="text-rift-teal">
                      {RELATION_TYPE_LABELS[r.type]}
                    </span>{" "}
                    {outgoing ? "→" : "←"} {other?.name_ko ?? "?"}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <h3 className="eyebrow mb-2">팩트 {selectedFacts.length}</h3>
      <div className="flex flex-col gap-2.5">
        {selectedFacts.map((f) => (
          <FactCard key={f.id} fact={f} />
        ))}
        {selectedFacts.length === 0 && (
          <p className="text-sm text-parchment-dim">
            이 엔티티에 직접 연결된 팩트가 없습니다.
          </p>
        )}
      </div>
    </section>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-gilt/60 bg-ink-800 text-gilt"
          : "border-ink-700 text-parchment-dim hover:text-parchment"
      }`}
    >
      {label}
    </button>
  );
}
