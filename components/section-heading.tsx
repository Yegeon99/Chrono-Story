// Section heading inside a page: display title closed by a fading hairline,
// the same grammar the sidebar uses for its group headers, one level down.
export function SectionHeading({
  children,
  accent,
  aside,
}: {
  children: React.ReactNode;
  /** Text colour class for the title, e.g. "text-rift-teal". */
  accent?: string;
  /** Optional right-aligned meta, rendered in the mono eyebrow style. */
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-3.5 flex items-center gap-3">
      <h2 className={`font-display text-lg font-bold ${accent ?? ""}`}>
        {children}
      </h2>
      <span className="rule-fade flex-1" aria-hidden />
      {aside && <span className="eyebrow shrink-0">{aside}</span>}
    </div>
  );
}
