"use client";

import { usePresence } from "@/hooks/usePresence";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import styles from "./PopupMenu.module.css";

export type PopupAnchor = {
  top: number;
  left?: number;
  right?: number;
};

/** Same measured-height popup used by Share — height locks to inner content. */
export function PopupMenu({
  open,
  onClose,
  anchor,
  ariaLabel,
  width,
  origin = "start",
  children,
}: {
  open: boolean;
  onClose: () => void;
  anchor: PopupAnchor | null;
  ariaLabel: string;
  width?: string | number;
  /** `start` = grow from left; `end` = grow from right (Share). */
  origin?: "start" | "end";
  children: ReactNode;
}) {
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const presence = usePresence(open, 420);
  const [menuHeight, setMenuHeight] = useState<number | null>(null);
  const [heightReady, setHeightReady] = useState(false);

  const measureHeight = useCallback(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const next = Math.ceil(inner.scrollHeight);
    const max = Math.round(Math.min(window.innerHeight * 0.7, 28 * 16));
    setMenuHeight(Math.min(next, max));
  }, []);

  useLayoutEffect(() => {
    if (!presence.mounted) {
      setMenuHeight(null);
      setHeightReady(false);
      return;
    }
    measureHeight();
    const id = window.requestAnimationFrame(() => setHeightReady(true));
    window.addEventListener("resize", measureHeight);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("resize", measureHeight);
    };
  }, [presence.mounted, measureHeight, children]);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner || !presence.mounted || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measureHeight());
    ro.observe(inner);
    return () => ro.disconnect();
  }, [presence.mounted, measureHeight, children]);

  useEffect(() => {
    if (!presence.mounted) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onPointer = (event: MouseEvent) => {
      const node = menuRef.current;
      if (!node) return;
      if (event.target instanceof Node && node.contains(event.target)) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [presence.mounted, onClose]);

  if (!presence.mounted || !anchor || typeof document === "undefined") return null;

  const anchorStyle =
    origin === "end" ?
      { top: anchor.top, right: anchor.right ?? 0 }
    : { top: anchor.top, left: anchor.left ?? 0 };

  return createPortal(
    <div className={styles.anchor} style={anchorStyle}>
      <div
        ref={menuRef}
        id={menuId}
        className={styles.menu}
        role="menu"
        aria-label={ariaLabel}
        data-origin={origin}
        data-ready={heightReady || undefined}
        data-closing={presence.closing || undefined}
        style={{
          ...(menuHeight ? { height: menuHeight } : null),
          ...(width != null ? { width } : null),
        }}
      >
        <div ref={innerRef} className={styles.inner}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export const popupMenuStyles = styles;
