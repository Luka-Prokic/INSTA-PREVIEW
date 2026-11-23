"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useRef, type Context, type ReactNode } from "react";
import styles from "../shell/AdminShell.module.css";

type SectionNavItem = { href: string; label: string; paths?: string[] };

export type SectionBack = { href: string; label: string };
type Direction = "forward" | "back" | "intro" | "none";
type Entry = { href: string; title: string; section: string };

type SectionNavValue = {
  back: SectionBack | null;
  direction: Direction;
  navId: string;
  flyFrom: DOMRect | null;
  popFrom: DOMRect | null;
  report: (title: string, titleBox: DOMRect | null, backBox: DOMRect | null) => void;
};

const sectionNavGlobal = globalThis as unknown as { __cakaSectionNav?: Context<SectionNavValue | null> };
const SectionNavContext = (sectionNavGlobal.__cakaSectionNav ??= createContext<SectionNavValue | null>(null));

export function useSectionNav() {
  return useContext(SectionNavContext);
}

export function sectionHome(pathname: string, nav: SectionNavItem[]): { href: string; label: string } | null {
  let best: { href: string; label: string; length: number } | null = null;
  for (const item of nav) {
    const paths = item.paths?.length ? item.paths : [item.href];
    for (const path of paths) {
      const hit = pathname === path || pathname.startsWith(`${path}/`);
      if (!hit) continue;
      if (!best || path.length > best.length) best = { href: item.href, label: item.label, length: path.length };
    }
  }
  return best ? { href: best.href, label: best.label } : null;
}

function stepHref(pathname: string, pack: string | null) {
  return pack ? `${pathname}?pack=${pack}` : pathname;
}

/** Parent in the page tree. Visit order does not change this. */
function hierarchyBack(
  pathname: string,
  pack: string | null,
  section: { href: string; label: string },
): SectionBack | null {
  if (pathname === section.href && !pack) return null;
  return { href: section.href, label: section.label };
}

function reduce(history: Entry[], href: string, pathname: string, pack: string | null, nav: SectionNavItem[]) {
  const section = sectionHome(pathname, nav);
  if (!section) return { history: [] as Entry[], direction: "none" as Direction, back: null as SectionBack | null };
  const back = hierarchyBack(pathname, pack, section);
  const same = history.length > 0 && history[0]?.section === section.href;
  if (!same) {
    const root: Entry = { href: section.href, title: section.label, section: section.href };
    const next = href === section.href ? [root] : [root, { href, title: "", section: section.href }];
    // The first page of a session is already on screen. Every later arrival,
    // including a section already visited, plays the same resolve.
    return {
      history: next,
      direction: history.length === 0 ? ("none" as Direction) : ("intro" as Direction),
      back,
    };
  }
  const index = history.findIndex((entry) => entry.href === href);
  if (index >= 0) {
    const next = history.slice(0, index + 1);
    return {
      history: next,
      direction: index < history.length - 1 ? ("back" as Direction) : ("none" as Direction),
      back,
    };
  }
  return {
    history: [...history, { href, title: "", section: section.href }],
    direction: "forward" as Direction,
    back,
  };
}

export function SectionNavProvider({ nav, children }: { nav: SectionNavItem[]; children: ReactNode }) {
  const pathname = usePathname();
  const pack = useSearchParams().get("pack");
  const href = stepHref(pathname, pack);
  const memory = useRef({ path: "", history: [] as Entry[], direction: "none" as Direction, back: null as SectionBack | null });
  const titleRect = useRef<DOMRect | null>(null);
  const backRect = useRef<DOMRect | null>(null);

  if (memory.current.path !== href) {
    const next = reduce(memory.current.history, href, pathname, pack, nav);
    memory.current = { path: href, ...next };
  }

  const report = useCallback((title: string, titleBox: DOMRect | null, backBox: DOMRect | null) => {
    const last = memory.current.history.at(-1);
    if (last && last.href === memory.current.path) last.title = title;
    if (titleBox) titleRect.current = titleBox;
    if (backBox) backRect.current = backBox;
  }, []);

  const direction = memory.current.direction;
  const value: SectionNavValue = {
    back: memory.current.back,
    direction,
    navId: `${href}:${direction}:${memory.current.history.length}`,
    flyFrom: direction === "forward" ? titleRect.current : null,
    popFrom: direction === "back" ? backRect.current : null,
    report,
  };

  return <SectionNavContext.Provider value={value}>{children}</SectionNavContext.Provider>;
}

export function SectionStage({ children }: { children: ReactNode }) {
  const href = stepHref(usePathname(), useSearchParams().get("pack"));
  const section = useSectionNav();
  const play = section && section.direction !== "none" ? section.direction : undefined;
  return (
    <div key={href} className={styles.stage} data-section-stage="" data-play={play}>
      {children}
    </div>
  );
}
