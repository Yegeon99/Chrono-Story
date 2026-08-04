"use client";

import { usePathname } from "next/navigation";
import { NAV_GROUPS, isActive } from "./nav";

/** Slim instrument strip above every screen: where you are, and the state of
 *  the knowledge base you are looking at. */
export function Topbar({
  kbVersion,
  updatedAt,
  conflicts,
}: {
  kbVersion: string;
  updatedAt: string;
  conflicts: number;
}) {
  const pathname = usePathname();
  const group = NAV_GROUPS.find((g) =>
    g.items.some((i) => isActive(pathname, i.href))
  );
  const item = group?.items.find((i) => isActive(pathname, i.href));

  return (
    <div className="sticky top-0 z-30 border-b border-ink-700/70 bg-ink-950/80 backdrop-blur-md">
      <div className="flex h-11 items-center gap-3 px-5 md:px-10">
        <p className="eyebrow flex min-w-0 items-center gap-2 truncate">
          {group && (
            <>
              <span className="text-gilt/70">{group.numeral}</span>
              <span>{group.label}</span>
              <span className="text-parchment-faint" aria-hidden>
                /
              </span>
            </>
          )}
          <span className="text-parchment">{item?.label ?? "Lore Guard"}</span>
        </p>

        <span className="rule-fade ml-1 hidden flex-1 sm:block" aria-hidden />

        <p className="eyebrow ml-auto flex shrink-0 items-center gap-3 sm:ml-0">
          <span className="hidden sm:inline">갱신 {updatedAt}</span>
          <span className="text-gilt">KB {kbVersion}</span>
          <span
            className={`flex items-center gap-1.5 ${
              conflicts > 0 ? "text-amber-warn" : "text-verdant"
            }`}
            title={
              conflicts > 0
                ? `표기·설정 충돌 ${conflicts}건 감시 중`
                : "정합성 이상 없음"
            }
          >
            <span className="status-dot" aria-hidden />
            <span className="hidden md:inline">
              {conflicts > 0 ? `충돌 ${conflicts}` : "정상"}
            </span>
          </span>
        </p>
      </div>
    </div>
  );
}
