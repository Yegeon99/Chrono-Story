"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  en: string;
  icon: React.ReactNode;
};

// 16px stroke glyphs, drawn inline — the project bans heavy UI dependencies
// (DIRECTIVE §1) and seven icons do not justify an icon package.
const S = {
  scroll: (
    <>
      <path d="M4.6 2.6h6.9a1.5 1.5 0 0 1 1.5 1.5v9.3H6.1a1.5 1.5 0 0 1-1.5-1.5z" />
      <path d="M4.6 2.6A1.5 1.5 0 0 0 3.1 4.1v7.8a1.5 1.5 0 0 0 1.5 1.5" />
      <path d="M6.6 5.6h4.4M6.6 8h4.4M6.6 10.4h2.6" />
    </>
  ),
  graph: (
    <>
      <circle cx="8" cy="3.7" r="1.7" />
      <circle cx="3.5" cy="11.7" r="1.7" />
      <circle cx="12.5" cy="11.7" r="1.7" />
      <path d="M7 5.3 4.5 10M9 5.3l2.5 4.7M5.2 11.7h5.6" />
    </>
  ),
  gauge: (
    <>
      <path d="M2.6 11.9a5.4 5.4 0 1 1 10.8 0" />
      <path d="M8 11.9 10.9 7.7" />
      <circle cx="8" cy="11.9" r="1" />
      <path d="M2.6 11.9h1.3M12.1 11.9h1.3M8 6.5V5.2" />
    </>
  ),
  seal: (
    <>
      <circle cx="8" cy="8" r="5.6" />
      <circle cx="8" cy="8" r="3.4" />
      <path d="M6.4 8.1 7.5 9.3l2.2-2.5" />
    </>
  ),
  doc: (
    <>
      <path d="M4.2 2.6h4.9l2.8 2.9v7.9H4.2z" />
      <path d="M9.1 2.6v2.9H12" />
      <path d="M6.2 8.6h3.6M6.2 10.8h2.4" />
    </>
  ),
  book: (
    <>
      <path d="M8 4.3S6.8 3.1 3.3 3.1v8.9c3.5 0 4.7 1.2 4.7 1.2s1.2-1.2 4.7-1.2V3.1C9.2 3.1 8 4.3 8 4.3Z" />
      <path d="M8 4.3v8.9" />
    </>
  ),
  hourglass: (
    <>
      <path d="M4.6 2.6h6.8M4.6 13.4h6.8" />
      <path d="M5.3 2.6v2c0 1.4 2.7 2.2 2.7 3.4s-2.7 2-2.7 3.4v2" />
      <path d="M10.7 2.6v2c0 1.4-2.7 2.2-2.7 3.4s2.7 2 2.7 3.4v2" />
    </>
  ),
};

function Glyph({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 opacity-80"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const NAV_GROUPS: {
  numeral: string;
  label: string;
  items: NavItem[];
}[] = [
  {
    numeral: "I",
    label: "세계관",
    items: [
      { href: "/", label: "연대기", en: "CHRONICLE", icon: S.scroll },
      {
        href: "/knowledge",
        label: "지식베이스",
        en: "KNOWLEDGE",
        icon: S.graph,
      },
    ],
  },
  {
    numeral: "II",
    label: "검증",
    items: [
      {
        href: "/dashboard",
        label: "QA 대시보드",
        en: "DASHBOARD",
        icon: S.gauge,
      },
      { href: "/gate", label: "검증 게이트", en: "GATE", icon: S.seal },
      { href: "/reports", label: "검사 리포트", en: "REPORTS", icon: S.doc },
      { href: "/glossary", label: "용어집", en: "GLOSSARY", icon: S.book },
      { href: "/ledger", label: "복선 원장", en: "LEDGER", icon: S.hourglass },
    ],
  },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Nav() {
  const pathname = usePathname();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  // On mobile the drawer collapses to a horizontal strip, where the current
  // screen can sit off-view. Centre it — but only when the strip really does
  // overflow, so the desktop column is never scrolled.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const active = activeRef.current;
    if (!scroller || !active) return;
    if (scroller.scrollWidth <= scroller.clientWidth) return;
    active.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <nav aria-label="주 메뉴" className="px-3 pb-4">
      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto md:flex-col md:gap-0 md:overflow-visible"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="md:mb-6 md:last:mb-0">
            <div className="nav-group-head hidden md:flex">
              <span className="nav-numeral">{group.numeral}</span>
              <span className="nav-group-label">{group.label}</span>
              <span className="rule-fade flex-1" aria-hidden />
            </div>
            <ul className="flex gap-1 md:flex-col md:gap-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      ref={active ? activeRef : undefined}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className="nav-item whitespace-nowrap"
                    >
                      <Glyph>{item.icon}</Glyph>
                      <span className="min-w-0">
                        <span className="nav-ko">{item.label}</span>
                        <span className="nav-en hidden md:block">
                          {item.en}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
