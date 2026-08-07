"use client";

import { usePathname } from "next/navigation";
import { NAV_GROUPS, isActive } from "./nav";

/** Slim instrument strip above every screen: where you are, and the state of
 *  the knowledge base you are looking at. The conflict readings live in the
 *  sidebar gauges only; the topbar stays a location and version indicator. */
export function Topbar({ kbVersion }: { kbVersion: string }) {
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
          <span className="text-gilt">KB {kbVersion}</span>
        </p>
      </div>
    </div>
  );
}
