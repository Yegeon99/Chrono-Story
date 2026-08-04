import Link from "next/link";
import { Nav } from "./nav";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="w-full shrink-0 border-b border-ink-700 bg-ink-900/30 md:sticky md:top-0 md:h-screen md:w-60 md:self-start md:overflow-y-auto md:border-b-0 md:border-r">
          <div className="px-5 pb-4 pt-6">
            <Link href="/" className="group block">
              <span className="font-display text-lg font-bold tracking-tight text-parchment transition-colors group-hover:text-gilt">
                Lore Guard
              </span>
              <span className="eyebrow mt-1 block whitespace-nowrap text-[10px]">
                CHRONO ODYSSEY · 내러티브 CI
              </span>
            </Link>
            <div
              className="mt-5 hidden h-px bg-gradient-to-r from-ink-700 to-transparent md:block"
              aria-hidden
            />
          </div>
          <Nav />
        </aside>
        <main className="flex-1 px-5 py-8 md:px-10 md:py-10">{children}</main>
      </div>
      <footer className="border-t border-ink-700 bg-ink-950/60 px-5 py-4 md:px-10">
        <p className="text-xs leading-relaxed text-parchment-dim">
          본 프로젝트는 크로노스튜디오·카카오게임즈와 무관한 비공식 팬 포트폴리오이며,
          크로노 오디세이의 모든 권리는 해당 권리자에게 있습니다.
        </p>
      </footer>
    </div>
  );
}
