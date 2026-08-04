"use client";

import { useRef, useState } from "react";
import type { Fact } from "@/lib/schema";
import type { GateDemo, GateResult } from "@/lib/gate";
import { FactCard } from "@/components/fact-card";

const CHECK_LABELS: Record<string, string> = {
  C1: "연표",
  C2: "설정",
  C3: "표기",
  C4: "톤",
};

const VERDICT_META: Record<
  GateResult["verdict"],
  { color: string; label: string }
> = {
  PASS: { color: "text-verdant", label: "통과" },
  WARN: { color: "text-amber-warn", label: "주의" },
  FAIL: { color: "text-ember", label: "충돌" },
};

type Stage = "idle" | "extract" | "judge" | "done" | "error";

export function GateClient({ demos, facts }: { demos: GateDemo[]; facts: Fact[] }) {
  const [text, setText] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<GateResult | null>(null);
  const [matchedNames, setMatchedNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [precomputed, setPrecomputed] = useState(false);
  const [sealKey, setSealKey] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const factById = new Map(facts.map((f) => [f.id, f]));

  const showResult = (r: GateResult, names: string[], pre: boolean) => {
    setResult(r);
    setMatchedNames(names);
    setPrecomputed(pre);
    setStage("done");
    setSealKey((k) => k + 1);
  };

  const loadDemo = (demo: GateDemo) => {
    abortRef.current?.abort();
    setText(demo.input_text);
    setError(null);
    showResult(demo.result, [], true);
  };

  const runLive = async () => {
    if (text.trim().length < 5) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setError(null);
    setResult(null);
    setPrecomputed(false);
    setStage("extract");

    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `요청 실패 (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const evt = JSON.parse(line);
          if (evt.stage === "extract") setStage("extract");
          if (evt.stage === "judge") setStage("judge");
          if (evt.stage === "error") throw new Error(evt.message);
          if (evt.stage === "done") {
            showResult(
              evt.result,
              (evt.matched_entities ?? []).map(
                (e: { name_ko: string }) => e.name_ko
              ),
              false
            );
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "판정 중 오류가 발생했습니다.");
      setStage("error");
    }
  };

  const running = stage === "extract" || stage === "judge";

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section aria-label="입력">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {demos.map((d) => {
            const dot = d.label.includes("PASS")
              ? "bg-verdant"
              : d.label.includes("FAIL")
                ? "bg-ember"
                : d.label.includes("WARN")
                  ? "bg-amber-warn"
                  : "bg-parchment-dim";
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => loadDemo(d)}
                title={d.description}
                className="chip"
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`}
                  aria-hidden
                />
                {d.label}
              </button>
            );
          })}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder="신규 퀘스트 대사, NPC 대화 등 검증할 텍스트를 붙여넣으세요."
          aria-label="검증할 텍스트"
          className="field resize-y"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={runLive}
            disabled={running || text.trim().length < 5}
            className="btn-gilt"
          >
            {running ? "판정 중…" : precomputed && result ? "실시간 재판정" : "판정 실행"}
          </button>
          {running && (
            <ol className="flex items-center gap-2 text-xs text-parchment-dim" aria-live="polite">
              <StageDot label="엔티티 추출" active={stage === "extract"} done={stage === "judge"} />
              <span>→</span>
              <StageDot label="지식베이스 대조·판정" active={stage === "judge"} done={false} />
            </ol>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-ember">
            {error}
          </p>
        )}
      </section>

      <section aria-label="판정 결과" aria-live="polite">
        {!result && !running && (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-md border border-dashed border-ink-700 px-6 text-center">
            <span className="seal-ghost" aria-hidden>
              ?
            </span>
            <p className="text-sm text-parchment-dim">
              판정 결과가 여기에 인장으로 찍힙니다.
            </p>
          </div>
        )}
        {running && (
          <div className="panel flex min-h-[280px] flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink-700 border-t-gilt" />
            <p className="text-sm text-parchment-dim">
              {stage === "extract" ? "텍스트에서 엔티티를 추출하는 중…" : "지식베이스와 대조하여 판정하는 중…"}
            </p>
          </div>
        )}
        {result && stage === "done" && (
          <div className="panel p-6">
            <div className="mb-5 flex items-start gap-6">
              <span key={sealKey} className={`seal shrink-0 ${VERDICT_META[result.verdict].color}`}>
                {result.verdict}
              </span>
              <div className="min-w-0 pt-1">
                <p className="eyebrow mb-1">
                  판정 {VERDICT_META[result.verdict].label}
                  {precomputed ? " · 사전 계산 결과" : " · 실시간 판정"}
                  {matchedNames.length > 0 && ` · 인식된 엔티티: ${matchedNames.join(", ")}`}
                </p>
                <p className="text-sm leading-relaxed">{result.summary_ko}</p>
              </div>
            </div>

            {result.issues.length > 0 && (
              <div className="flex flex-col gap-3">
                {result.issues.map((issue, i) => (
                  <div
                    key={i}
                    className={`rounded-md border border-ink-700 border-l-2 bg-ink-950/60 px-4 py-3 ${
                      issue.severity === "critical"
                        ? "border-l-ember"
                        : issue.severity === "warning"
                          ? "border-l-amber-warn"
                          : "border-l-rift-teal"
                    }`}
                  >
                    <p className="eyebrow mb-1">
                      {issue.check_type} {CHECK_LABELS[issue.check_type]} · {issue.severity}
                    </p>
                    <p className="text-sm">{issue.description_ko}</p>
                    <p className="mt-1.5 text-xs text-parchment-dim">
                      제안: {issue.suggestion_ko}
                    </p>
                    {issue.evidence_fact_ids.length > 0 && (
                      <div className="mt-3 flex flex-col gap-2">
                        {issue.evidence_fact_ids.map((id) => {
                          const f = factById.get(id);
                          return f ? <FactCard key={id} fact={f} /> : null;
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function StageDot({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <li className={active ? "text-gilt" : done ? "text-verdant" : ""}>
      {done ? "✓ " : ""}
      {label}
    </li>
  );
}
