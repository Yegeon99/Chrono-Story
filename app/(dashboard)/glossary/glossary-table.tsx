"use client";

import { useMemo, useState } from "react";
import type { GlossaryEntry } from "@/lib/schema";
import {
  CONFIDENCE_LABELS,
  ENTITY_TYPE_LABELS,
  FACT_STATUS_LABELS,
} from "@/lib/labels";
import { isChosungQuery, toChosung } from "@/lib/hangul";

const CSV_COLUMNS = [
  "ko",
  "en",
  "variants",
  "type",
  "definition_ko",
  "source_url",
  "confidence",
  "status",
] as const;

function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function GlossaryTable({ entries }: { entries: GlossaryEntry[] }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [confidenceFilter, setConfidenceFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const chosung = isChosungQuery(q);
    return entries
      .filter((e) => (typeFilter ? e.type === typeFilter : true))
      .filter((e) => (statusFilter ? e.status === statusFilter : true))
      .filter((e) => (confidenceFilter ? e.confidence === confidenceFilter : true))
      .filter((e) => {
        if (!q) return true;
        if (chosung) return toChosung(e.ko).includes(q);
        return (
          e.ko.toLowerCase().includes(q) ||
          e.en.toLowerCase().includes(q) ||
          e.variants.some((v) => v.toLowerCase().includes(q))
        );
      });
  }, [entries, query, typeFilter, statusFilter, confidenceFilter]);

  const exportCsv = () => {
    const rows = filtered.map((e) =>
      CSV_COLUMNS.map((c) =>
        csvEscape(c === "variants" ? e.variants.join(" / ") : String(e[c]))
      ).join(",")
    );
    // BOM so Korean opens correctly in Excel
    download(
      "loreguard-glossary.csv",
      "﻿" + [CSV_COLUMNS.join(","), ...rows].join("\r\n"),
      "text/csv;charset=utf-8"
    );
  };

  const exportJson = () => {
    download(
      "loreguard-glossary.json",
      JSON.stringify(filtered, null, 2),
      "application/json"
    );
  };

  const types = [...new Set(entries.map((e) => e.type))];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="한글·영문·초성 검색 (예: ㅋㄹㄴㅅ)"
            aria-label="용어 검색"
            className="field field-sm max-w-xs"
          />
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="btn-ghost border-gilt/50 text-gilt"
            >
              CSV 내보내기
            </button>
            <button
              type="button"
              onClick={exportJson}
              className="btn-ghost"
            >
              JSON 내보내기
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip label="전체" active={!typeFilter} onClick={() => setTypeFilter(null)} />
          {types.map((t) => (
            <Chip
              key={t}
              label={ENTITY_TYPE_LABELS[t]}
              active={typeFilter === t}
              onClick={() => setTypeFilter(typeFilter === t ? null : t)}
            />
          ))}
          <span className="mx-1 h-4 w-px self-center bg-ink-700" />
          {(["conflicted", "deprecated"] as const).map((s) => (
            <Chip
              key={s}
              label={s === "conflicted" ? "⚠ 표기 충돌" : "폐기 용어"}
              active={statusFilter === s}
              onClick={() => setStatusFilter(statusFilter === s ? null : s)}
            />
          ))}
          <span className="mx-1 h-4 w-px self-center bg-ink-700" />
          {(["confirmed", "probable", "speculative"] as const).map((c) => (
            <Chip
              key={c}
              label={CONFIDENCE_LABELS[c]}
              active={confidenceFilter === c}
              onClick={() =>
                setConfidenceFilter(confidenceFilter === c ? null : c)
              }
            />
          ))}
        </div>
      </div>

      <p className="eyebrow mb-2">{filtered.length}개 용어</p>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-ink-700 text-left">
              <Th>한글</Th>
              <Th>영문</Th>
              <Th>변형</Th>
              <Th>타입</Th>
              <Th>정의</Th>
              <Th>신뢰도</Th>
              <Th>출처</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700">
            {filtered.map((e) => (
              <tr
                key={e.entity_id}
                className={`transition-colors hover:bg-ink-800/40 ${
                  e.status === "deprecated" ? "opacity-60" : ""
                }`}
              >
                <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                  {e.ko}
                  {e.conflict && (
                    <span className="ml-2 rounded-full border border-ember/50 px-2 py-px text-xs text-ember">
                      ⚠ 표기 충돌
                    </span>
                  )}
                  {e.status === "deprecated" && (
                    <span className="ml-2 rounded-full border border-ink-700 px-2 py-px text-xs text-parchment-dim">
                      폐기
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap">{e.en}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-amber-warn whitespace-nowrap">
                  {e.variants.join(" / ") || "—"}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-xs text-parchment-dim">
                  {ENTITY_TYPE_LABELS[e.type]}
                </td>
                <td className="min-w-[240px] px-3 py-2.5 text-xs text-parchment-dim">
                  {e.definition_ko}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-xs">
                  {CONFIDENCE_LABELS[e.confidence]}
                  <span className="ml-1 text-parchment-dim">
                    · {FACT_STATUS_LABELS[e.status]}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <a
                    href={e.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-rift-teal underline-offset-2 hover:underline"
                  >
                    링크 ↗
                  </a>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-sm text-parchment-dim"
                >
                  조건에 맞는 용어가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="eyebrow px-3 py-2.5 font-normal whitespace-nowrap">{children}</th>
  );
}

function Chip({
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
