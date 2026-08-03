import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { loadFacts } from "@/lib/kb";
import { GateDemoSchema } from "@/lib/gate";
import { GateClient } from "./gate-client";

export const metadata = { title: "검증 게이트" };

function loadDemos() {
  const p = path.join(process.cwd(), "data", "gate-demos.json");
  if (!fs.existsSync(p)) return [];
  return z.array(GateDemoSchema).parse(JSON.parse(fs.readFileSync(p, "utf-8")));
}

export default function GatePage() {
  const demos = loadDemos();
  const facts = loadFacts();

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <p className="eyebrow mb-2">NARRATIVE CI · 판정 목표 30초 이내</p>
        <h1 className="font-display text-2xl font-black tracking-tight">
          신규 텍스트 검증 게이트
        </h1>
        <p className="mt-3 max-w-xl text-sm text-parchment-dim">
          신규 대사·서술을 붙여넣으면 지식베이스와 대조해 PASS / WARN / FAIL을
          판정합니다. 데모 버튼은 사전 계산된 결과를 즉시 보여주며, 실시간
          재판정도 가능합니다.
        </p>
      </header>
      <GateClient demos={demos} facts={facts} />
    </div>
  );
}
