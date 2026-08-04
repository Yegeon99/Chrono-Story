"use client";

import { useMemo, useState } from "react";
import type { CheckReport, Fact } from "@/lib/schema";
import { FactCard } from "@/components/fact-card";

const CHECK_LABELS: Record<string, string> = {
  C1: "연표 충돌",
  C2: "설정 모순",
  C3: "표기 일관성",
  C4: "톤 위반",
  C5: "미해소 복선",
};

const SEVERITY_META: Record<
  string,
  { label: string; text: string; border: string }
> = {
  critical: { label: "심각", text: "text-ember", border: "border-l-ember" },
  warning: { label: "주의", text: "text-amber-warn", border: "border-l-amber-warn" },
  info: { label: "정보", text: "text-rift-teal", border: "border-l-rift-teal" },
};

export function ReportList({
  reports,
  facts,
}: {
  reports: CheckReport[];
  facts: Fact[];
}) {
  const [severity, setSeverity] = useState<string | null>(null);
  const [check, setCheck] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const factById = useMemo(() => new Map(facts.map((f) => [f.id, f])), [facts]);

  const order = { critical: 0, warning: 1, info: 2 } as const;
  const filtered = reports
    .filter((r) => (severity ? r.severity === severity : true))
    .filter((r) => (check ? r.check_type === check : true))
    .sort(
      (a, b) =>
        order[a.severity] - order[b.severity] || a.id.localeCompare(b.id)
    );

  const counts = {
    critical: reports.filter((r) => r.severity === "critical").length,
    warning: reports.filter((r) => r.severity === "warning").length,
    info: reports.filter((r) => r.severity === "info").length,
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <Chip
          label={`전체 ${reports.length}`}
          active={severity === null}
          onClick={() => setSeverity(null)}
        />
        {(["critical", "warning", "info"] as const).map((s) => (
          <Chip
            key={s}
            label={`${SEVERITY_META[s].label} ${counts[s]}`}
            active={severity === s}
            onClick={() => setSeverity(severity === s ? null : s)}
            accent={SEVERITY_META[s].text}
          />
        ))}
        <span className="mx-2 hidden h-4 w-px bg-ink-700 sm:block" />
        {Object.entries(CHECK_LABELS).map(([id, label]) => (
          <Chip
            key={id}
            label={`${id} ${label}`}
            active={check === id}
            onClick={() => setCheck(check === id ? null : id)}
          />
        ))}
      </div>

      <ul className="flex flex-col gap-2.5">
        {filtered.map((r) => {
          const sev = SEVERITY_META[r.severity];
          const open = openId === r.id;
          return (
            <li key={r.id}>
              <article
                className={`panel border-l-2 ${sev.border}`}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : r.id)}
                  aria-expanded={open}
                  className="flex w-full flex-col gap-1 rounded-md px-4 py-3 text-left transition-colors hover:bg-ink-800/40"
                >
                  <span className="eyebrow">
                    {r.id} · {r.check_type} {CHECK_LABELS[r.check_type]} ·{" "}
                    <span className={sev.text}>{sev.label}</span>
                  </span>
                  <span className="text-sm">{r.verdict_ko}</span>
                </button>
                {open && (
                  <div className="border-t border-ink-700 px-4 py-3">
                    <h3 className="eyebrow mb-1">판정 근거</h3>
                    <p className="mb-3 text-sm text-parchment-dim">{r.evidence_ko}</p>
                    <h3 className="eyebrow mb-1">권고 조치</h3>
                    <p className="mb-3 text-sm">{r.recommendation_ko}</p>
                    {r.fact_ids.length > 0 && (
                      <>
                        <h3 className="eyebrow mb-2">근거 팩트 {r.fact_ids.length}</h3>
                        <div className="flex flex-col gap-2">
                          {r.fact_ids.map((id) => {
                            const f = factById.get(id);
                            return f ? <FactCard key={id} fact={f} /> : null;
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </article>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="rounded-md border border-dashed border-ink-700 px-6 py-12 text-center text-sm text-parchment-dim">
            조건에 맞는 검사 결과가 없습니다.
          </li>
        )}
      </ul>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
  accent,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-gilt/60 bg-ink-800 text-gilt"
          : `border-ink-700 hover:text-parchment ${accent ?? "text-parchment-dim"}`
      }`}
    >
      {label}
    </button>
  );
}
