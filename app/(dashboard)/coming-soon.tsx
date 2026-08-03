export function ComingSoon({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <p className="eyebrow mb-2">{phase} 예정</p>
        <h1 className="font-display text-2xl font-black tracking-tight">{title}</h1>
        <p className="mt-3 max-w-xl text-sm text-parchment-dim">{description}</p>
      </header>
      <div className="rounded-md border border-dashed border-ink-700 px-6 py-16 text-center text-sm text-parchment-dim">
        이 화면은 다음 단계에서 구현됩니다.
      </div>
    </div>
  );
}
