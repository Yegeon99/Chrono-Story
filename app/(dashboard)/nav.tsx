"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GROUPS: {
  label: string | null;
  items: { href: string; label: string; en: string }[];
}[] = [
  {
    label: "세계관",
    items: [
      { href: "/", label: "연대기", en: "Chronicle" },
      { href: "/knowledge", label: "지식베이스", en: "Knowledge" },
    ],
  },
  {
    label: "검증",
    items: [
      { href: "/dashboard", label: "QA 대시보드", en: "Dashboard" },
      { href: "/gate", label: "검증 게이트", en: "Gate" },
      { href: "/reports", label: "검사 리포트", en: "Reports" },
      { href: "/glossary", label: "용어집", en: "Glossary" },
      { href: "/ledger", label: "복선 원장", en: "Ledger" },
    ],
  },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav aria-label="주 메뉴" className="px-3 pb-6">
      <div className="flex gap-4 overflow-x-auto md:flex-col md:gap-0 md:overflow-visible">
        {GROUPS.map((group) => (
          <div key={group.label ?? "root"} className="md:mb-4">
            {group.label && (
              <p className="eyebrow hidden px-3 pb-1.5 pt-1 md:block">
                {group.label}
              </p>
            )}
            <ul className="flex gap-1 md:flex-col">
              {group.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-baseline gap-2 whitespace-nowrap rounded border-l-2 px-3 py-2 text-sm transition-colors ${
                        active
                          ? "border-gilt bg-gradient-to-r from-ink-800 to-ink-800/20 text-gilt"
                          : "border-transparent text-parchment-dim hover:bg-ink-900 hover:text-parchment"
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="eyebrow hidden md:inline">{item.en}</span>
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
