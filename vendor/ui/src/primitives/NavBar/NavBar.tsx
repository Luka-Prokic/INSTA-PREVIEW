"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { cn } from "../../utils/cn";
import styles from "./NavBar.module.css";

export type NavBarItem = {
  id: string;
  label: string;
  disabled?: boolean;
};

export type NavBarSize = "sm" | "md";

export type NavBarProps = {
  items: NavBarItem[];
  value: string;
  onChange: (id: string) => void;
  size?: NavBarSize;
  className?: string;
} & Omit<HTMLAttributes<HTMLElement>, "onChange">;

/**
 * Pill segmented nav with a sliding secondary thumb (Caka take on Zlatokosin NavBar).
 * Selected state uses black secondary, not primary red.
 */
export function NavBar({
  items,
  value,
  onChange,
  size = "md",
  className,
  "aria-label": ariaLabel = "Sections",
  ...rest
}: NavBarProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [thumb, setThumb] = useState({ left: 0, width: 0 });
  const [moving, setMoving] = useState(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const el = root.querySelector<HTMLElement>(
      `[data-nav-id="${CSS.escape(value)}"]`,
    );
    if (!el) return;

    setThumb({ left: el.offsetLeft, width: el.offsetWidth });
    setMoving(true);

    const thumbEl = root.querySelector<HTMLElement>(`.${styles.thumb}`);
    if (!thumbEl) return;

    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName === "left" || e.propertyName === "width") {
        setMoving(false);
      }
    };
    thumbEl.addEventListener("transitionend", onEnd);
    return () => thumbEl.removeEventListener("transitionend", onEnd);
  }, [value, items, size]);

  const thumbStyle = {
    ["--nav-thumb-left" as string]: `${thumb.left}px`,
    ["--nav-thumb-width" as string]: `${thumb.width}px`,
  } as CSSProperties;

  return (
    <nav
      {...rest}
      ref={rootRef}
      className={cn(styles.nav, className)}
      data-size={size}
      aria-label={ariaLabel}
    >
      <span
        className={cn(styles.thumb, moving && styles.thumbMoving)}
        style={thumbStyle}
        aria-hidden
      />
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            data-nav-id={item.id}
            className={styles.item}
            aria-pressed={selected}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
          >
            <span className={styles.label}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
