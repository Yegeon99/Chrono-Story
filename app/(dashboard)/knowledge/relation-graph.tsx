"use client";

// Relation graph — self-rendered SVG + d3-force for layout only (DIRECTIVE §1).
// ~53 nodes: no heavy graph library needed. Falls back to list view on mobile.
import { useMemo } from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import type { Entity, Relation } from "@/lib/schema";
import { ENTITY_TYPE_LABELS, RELATION_TYPE_LABELS } from "@/lib/labels";

const TYPE_COLORS: Record<Entity["type"], string> = {
  character: "#C9A227", // gilt
  faction: "#B8452F", // ember
  planet: "#3E7C8A", // rift teal
  concept: "#9A958A", // parchment dim
  artifact: "#C97F2E", // amber
  location: "#4C8F6E", // verdant
  creature: "#8A5FA0", // muted violet
  event: "#5F7FA0", // muted steel blue
};

const W = 920;
const H = 640;

type Node = SimulationNodeDatum & {
  id: string;
  name: string;
  type: Entity["type"];
  degree: number;
};
type Link = SimulationLinkDatum<Node> & { relType: string };

export function RelationGraph({
  entities,
  relations,
  selectedId,
  onSelect,
}: {
  entities: Entity[];
  relations: Relation[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  // Layout computed once per data change. d3-force is fully deterministic here
  // (no user-driven randomness), so this is safe in render and SSR-consistent.
  const positioned = useMemo(() => {
    const degree = new Map<string, number>();
    for (const r of relations) {
      degree.set(r.from, (degree.get(r.from) ?? 0) + 1);
      degree.set(r.to, (degree.get(r.to) ?? 0) + 1);
    }
    const nodes: Node[] = entities.map((e) => ({
      id: e.id,
      name: e.name_ko,
      type: e.type,
      degree: degree.get(e.id) ?? 0,
    }));
    const ids = new Set(nodes.map((n) => n.id));
    const links: Link[] = relations
      .filter((r) => ids.has(r.from) && ids.has(r.to))
      .map((r) => ({ source: r.from, target: r.to, relType: r.type }));
    const sim = forceSimulation<Node>(nodes)
      .force(
        "link",
        forceLink<Node, Link>(links)
          .id((d) => d.id)
          .distance(70)
          .strength(0.5)
      )
      .force("charge", forceManyBody().strength(-160))
      .force("center", forceCenter(W / 2, H / 2))
      .force("collide", forceCollide<Node>().radius((d) => nodeRadius(d) + 14))
      .stop();
    for (let i = 0; i < 300; i++) sim.tick();
    // Round positions so server- and client-rendered SVG attribute strings are
    // byte-identical — raw floats can differ in the last bits across V8
    // versions and would trip React hydration.
    for (const n of nodes) {
      n.x = Math.round((n.x ?? 0) * 10) / 10;
      n.y = Math.round((n.y ?? 0) * 10) / 10;
    }
    return { nodes, links };
  }, [entities, relations]);

  const neighborIds = new Set<string>();
  if (selectedId) {
    neighborIds.add(selectedId);
    for (const l of positioned.links) {
      const s = (l.source as Node).id;
      const t = (l.target as Node).id;
      if (s === selectedId) neighborIds.add(t);
      if (t === selectedId) neighborIds.add(s);
    }
  }

  return (
    <div className="panel overflow-hidden">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="세계관 관계망 그래프"
        className="h-auto w-full"
        onClick={() => onSelect(null)}
      >
        <defs>
          <radialGradient id="graph-vignette" cx="50%" cy="42%" r="75%">
            <stop offset="0%" stopColor="#161a24" />
            <stop offset="100%" stopColor="#0e1118" />
          </radialGradient>
          <filter id="node-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <rect width={W} height={H} fill="url(#graph-vignette)" />
        {positioned.links.map((l, i) => {
          const s = l.source as Node;
          const t = l.target as Node;
          const active =
            selectedId !== null && (s.id === selectedId || t.id === selectedId);
          return (
            <line
              key={i}
              x1={s.x}
              y1={s.y}
              x2={t.x}
              y2={t.y}
              stroke={active ? "#C9A227" : "#232838"}
              strokeWidth={active ? 1.6 : 1}
              strokeOpacity={selectedId && !active ? 0.35 : 1}
            >
              <title>{`${s.name} — ${RELATION_TYPE_LABELS[l.relType] ?? l.relType} → ${t.name}`}</title>
            </line>
          );
        })}
        {positioned.nodes.map((n) => {
          const dimmed = selectedId !== null && !neighborIds.has(n.id);
          const r = nodeRadius(n);
          return (
            <g
              key={n.id}
              transform={`translate(${n.x},${n.y})`}
              opacity={dimmed ? 0.3 : 1}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(n.id === selectedId ? null : n.id);
              }}
            >
              {n.id === selectedId && (
                <circle
                  r={r + 7}
                  fill={TYPE_COLORS[n.type]}
                  opacity={0.45}
                  filter="url(#node-glow)"
                  aria-hidden
                />
              )}
              <circle
                r={r}
                fill={TYPE_COLORS[n.type]}
                fillOpacity={0.85}
                stroke={n.id === selectedId ? "#E8E2D4" : "#0C0E13"}
                strokeWidth={n.id === selectedId ? 2.5 : 1}
              />
              <text
                y={r + 12}
                textAnchor="middle"
                fontSize={11}
                fill={n.id === selectedId ? "#E8E2D4" : "#9A958A"}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {n.name}
              </text>
              <title>{`${n.name} (${ENTITY_TYPE_LABELS[n.type]}) · 관계 ${n.degree}건`}</title>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-ink-700 px-4 py-2.5">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5 text-xs text-parchment-dim">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            {ENTITY_TYPE_LABELS[type]}
          </span>
        ))}
      </div>
    </div>
  );
}

function nodeRadius(n: Node): number {
  return 6 + Math.min(10, n.degree * 1.1);
}
