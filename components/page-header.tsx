// Shared page header: eyebrow / serif title / gilt hairline / lede.
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
      <p className="eyebrow mb-2.5">{eyebrow}</p>
      <h1
        className={`font-display font-black tracking-tight ${
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
          className={`mt-4 max-w-xl text-sm leading-relaxed text-parchment-dim ${
            center ? "mx-auto" : ""
          }`}
        >
          {lede}
        </p>
      )}
    </header>
  );
}
