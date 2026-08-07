import Link from "next/link";
import {
  loadFacts,
  loadForeshadowing,
  loadKbMeta,
  loadLatestReports,
} from "@/lib/kb";
import { Nav } from "./nav";
import { Topbar } from "./topbar";

/** The wordmark sigil: a lozenge (the archive seal) enclosing an hourglass
 *  (the time motif). Drawn inline so it inherits gilt on hover. */
function Sigil() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
      className="shrink-0 text-gilt"
      aria-hidden
    >
      <path d="M12 1.6 22.4 12 12 22.4 1.6 12Z" />
      <path d="M8.6 7.2h6.8M8.6 16.8h6.8" />
      <path d="M9.3 7.2v1.4c0 1.2 2.7 2.2 2.7 3.4s-2.7 2.2-2.7 3.4v1.4" />
      <path d="M14.7 7.2v1.4c0 1.2-2.7 2.2-2.7 3.4s2.7 2.2 2.7 3.4v1.4" />
    </svg>
  );
}

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const meta = loadKbMeta();
  const facts = loadFacts();
  const foreshadowing = loadForeshadowing();
  const reports = loadLatestReports();

  const conflicts = facts.filter((f) => f.status === "conflicted").length;
  const unresolved = foreshadowing.filter(
    (f) => f.status === "unresolved" || f.status === "resurfaced"
  ).length;

  // Live readings for the sidebar's instrument panel (DIRECTIVE §5 concept).
  // These deliberately do NOT ride on the nav items: three differently-scoped
  // measurements rendered as bare badges read as unread counts and tell you
  // nothing about what is being measured. Each gets its own label instead, and
  // links to the screen that explains it.
  const gauges = [
    {
      href: "/knowledge",
      label: "표기·설정 충돌",
      value: conflicts,
      tone: "text-ember",
    },
    {
      href: "/reports",
      label: "검사 발견",
      value: reports.length,
      tone: "text-amber-warn",
    },
    {
      href: "/ledger",
      label: "미해소 복선",
      value: unresolved,
      tone: "text-rift-teal",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full shrink-0 border-b border-ink-700 bg-ink-900/40 md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:border-b-0 md:border-r">
        <div className="px-5 pb-4 pt-5 md:pt-6">
          <Link href="/" className="group block">
            <span className="flex items-center gap-2.5">
              <Sigil />
              <span className="font-display text-lg font-bold text-parchment transition-colors group-hover:text-gilt">
                Lore Guard
              </span>
            </span>
            <span className="eyebrow mt-1.5 block whitespace-nowrap text-[9px] leading-tight tracking-[0.08em]">
              CHRONO ODYSSEY · 내러티브 CI
            </span>
          </Link>
          <div className="rule-double mt-4 hidden md:block" aria-hidden />
        </div>

        <div className="md:min-h-0 md:flex-1 md:overflow-y-auto">
          <Nav />
        </div>

        {/* Instrument dock, pinned to the foot of the drawer. */}
        <div className="hidden shrink-0 border-t border-ink-700/70 px-5 py-4 md:block">
          <p className="eyebrow mb-2 flex items-center gap-2">
            <span className="inline-block h-2 w-px shrink-0 bg-gilt" aria-hidden />
            정합 지표
          </p>
          <ul>
            {gauges.map((g) => (
              <li key={g.href}>
                <Link
                  href={g.href}
                  className="gauge-row"
                  title={`${g.label} ${g.value}건, 자세히 보기`}
                >
                  <span className="gauge-label">{g.label}</span>
                  <span className="gauge-leader" aria-hidden />
                  <span className={`gauge-value ${g.tone}`}>{g.value}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="eyebrow mt-3 border-t border-ink-700/60 pt-2.5 text-[10px] text-parchment-faint">
            KB <span className="text-gilt">{meta.kb_version}</span>
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar kbVersion={meta.kb_version} />
        <main className="flex-1 px-5 py-9 md:px-10 md:py-12">{children}</main>
        <footer className="border-t border-ink-700/70 bg-ink-950/70 px-5 py-5 md:px-10">
          <div className="rule-fade mb-3.5 max-w-24" aria-hidden />
          <p className="max-w-3xl text-xs leading-relaxed text-parchment-dim">
            본 프로젝트는 크로노스튜디오·카카오게임즈와 무관한 비공식 팬
            포트폴리오이며, 크로노 오디세이의 모든 권리는 해당 권리자에게
            있습니다.
          </p>
          {/* Credit line: mono eyebrow register, set apart from the body-text
              disclaimer above so the two read as different kinds of statement. */}
          <p className="eyebrow mt-3 flex flex-wrap items-center gap-x-2">
            <span>Made by 예건</span>
            <span aria-hidden>·</span>
            <a
              href="https://github.com/Yegeon99/Chrono-Story"
              target="_blank"
              rel="noreferrer"
              className="text-gilt transition-colors hover:text-gilt-bright"
            >
              GitHub 리포지토리 ↗
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
