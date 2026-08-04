// Shared page header: gilt tick / mono eyebrow / display title / rule / lede.
// Keeps the seven dashboard screens typographically identical.
export function PageHeader({
  eyebrow,
  title,
  lede,
  center = false,
  size = "base",
  className = "",
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  lede?: React.ReactNode;
  center?: boolean;
  size?: "base" | "lg";
  className?: string;
}) {
  return (
    <header className={`${center ? "text-center" : ""} ${className}`}>
      <p
        className={`eyebrow mb-3 flex items-center gap-2 ${
          center ? "justify-center" : ""
        }`}
      >
        <span
          className="inline-block h-2.5 w-px shrink-0 bg-gilt"
          aria-hidden
        />
        <span className="min-w-0">{eyebrow}</span>
      </p>
      <h1
        className={`font-display font-bold ${
          size === "lg" ? "text-3xl" : "text-2xl"
        }`}
      >
        {title}
      </h1>
      <div
        className={`title-rule mt-4 ${center ? "title-rule-center" : ""}`}
        aria-hidden
      />
      {lede && (
        <p
          className={`mt-4 max-w-xl text-sm leading-[1.85] text-parchment-dim ${
            center ? "mx-auto" : ""
          }`}
        >
          {lede}
        </p>
      )}
    </header>
  );
}
