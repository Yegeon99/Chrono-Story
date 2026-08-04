import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { loadFacts } from "@/lib/kb";
import { GateDemoSchema } from "@/lib/gate";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader
        className="mb-8"
        eyebrow="NARRATIVE CI · 판정 목표 30초 이내"
        title="신규 텍스트 검증 게이트"
        lede="신규 대사·서술을 붙여넣으면 지식베이스와 대조해 PASS / WARN / FAIL을 판정합니다. 데모 버튼은 사전 계산된 결과를 즉시 보여주며, 실시간 재판정도 가능합니다."
      />
      <GateClient demos={demos} facts={facts} />
    </div>
  );
}
