import Link from "next/link";
import { Nav } from "./nav";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="w-full shrink-0 border-b border-ink-700 md:w-60 md:border-b-0 md:border-r">
          <div className="px-5 py-6">
            <Link href="/" className="block">
              <span className="font-display text-lg font-bold tracking-tight text-parchment">
                Lore Guard
              </span>
              <span className="eyebrow mt-1 block">CHRONO ODYSSEY · 내러티브 CI</span>
            </Link>
          </div>
          <Nav />
        </aside>
        <main className="flex-1 px-5 py-8 md:px-10">{children}</main>
      </div>
      <footer className="border-t border-ink-700 px-5 py-4 md:px-10">
        <p className="text-xs text-parchment-dim">
          본 프로젝트는 크로노스튜디오·카카오게임즈와 무관한 비공식 팬 포트폴리오이며,
          크로노 오디세이의 모든 권리는 해당 권리자에게 있습니다.
        </p>
      </footer>
    </div>
  );
}
