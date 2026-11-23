"use client";

import { usePointerTilt } from "@/lib/caka-admin";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Shell.module.css";

/** CAKA-CMS SettingsRows: card tilt + row hot hover / click-forward. */
export function SettingsCards({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  usePointerTilt(ref, { tilt: `.${styles.card}` });

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const mark = () => {
      root.querySelectorAll(`.${styles.card}`).forEach((node) => {
        if (!node.hasAttribute("data-tilt")) node.setAttribute("data-tilt", "");
      });
      root.querySelectorAll(`.${styles.row}`).forEach((node) => {
        // Static rows host their own controls (e.g. FlipToggle) — don't steal clicks.
        if (node.classList.contains(styles.rowStatic)) {
          node.removeAttribute("data-spot");
          return;
        }
        if (!node.hasAttribute("data-spot")) node.setAttribute("data-spot", "");
      });
    };
    mark();
    const observer = new MutationObserver(mark);
    observer.observe(root, { childList: true, subtree: true });

    const slop = 16;
    const probes: Array<[number, number]> = [
      [slop, 0],
      [-slop, 0],
      [0, slop],
      [0, -slop],
      [slop, slop],
      [slop, -slop],
      [-slop, slop],
      [-slop, -slop],
    ];
    let hot: HTMLElement | null = null;
    const clearHot = () => {
      hot?.removeAttribute("data-hot");
      hot = null;
    };
    const rowFrom = (x: number, y: number) => {
      const node = document.elementFromPoint(x, y);
      const row = node instanceof Element ? node.closest(`.${styles.row}`) : null;
      if (!(row instanceof HTMLElement) || !root.contains(row) || row.matches(":disabled")) return null;
      if (row.classList.contains(styles.rowStatic)) return null;
      return row;
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        clearHot();
        return;
      }
      const direct = rowFrom(event.clientX, event.clientY);
      const next =
        direct ??
        (hot && probes.some(([dx, dy]) => rowFrom(event.clientX + dx, event.clientY + dy) === hot) ?
          hot
        : probes.reduce<HTMLElement | null>(
            (found, [dx, dy]) => found ?? rowFrom(event.clientX + dx, event.clientY + dy),
            null,
          ));
      if (next === hot) return;
      clearHot();
      if (!next) return;
      next.setAttribute("data-hot", "");
      hot = next;
    };

    let forwarding = false;
    const onClick = (event: MouseEvent) => {
      if (forwarding || !hot || event.button !== 0) return;
      if (!(event.target instanceof Node) || hot.contains(event.target)) return;
      const occupied =
        event.target instanceof Element ?
          event.target.closest("a, button, input, textarea, select, label")
        : null;
      if (occupied) return;
      event.preventDefault();
      forwarding = true;
      hot.click();
      forwarding = false;
    };

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", clearHot);
    root.addEventListener("click", onClick);
    return () => {
      observer.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", clearHot);
      root.removeEventListener("click", onClick);
      clearHot();
    };
  }, []);

  return (
    <div ref={ref} className={styles.settingsColumn}>
      {children}
    </div>
  );
}
