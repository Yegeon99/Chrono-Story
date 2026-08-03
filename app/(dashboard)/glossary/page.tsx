import { loadGlossary, loadKbMeta } from "@/lib/kb";
import { GlossaryTable } from "./glossary-table";

export const metadata = { title: "용어집" };

export default function GlossaryPage() {
  const meta = loadKbMeta();
  const entries = loadGlossary();
  const conflicts = entries.filter((e) => e.conflict).length;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <p className="eyebrow mb-2">
          KB {meta.kb_version} · 용어 {entries.length} · 충돌 {conflicts}
        </p>
        <h1 className="font-display text-2xl font-black tracking-tight">
          한영 용어집
        </h1>
        <p className="mt-3 max-w-xl text-sm text-parchment-dim">
          지식베이스의 표기 팩트에서 자동 편찬됩니다. 충돌 표기는 숨기지 않고
          병기하며, 모든 항목은 출처 링크를 보유합니다.
        </p>
      </header>
      <GlossaryTable entries={entries} />
    </div>
  );
}
