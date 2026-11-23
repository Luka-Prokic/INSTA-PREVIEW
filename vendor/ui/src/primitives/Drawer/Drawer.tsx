"use client";

import {
  useEffect,
  useId,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../../utils/cn";
import { Heading } from "../Heading";
import { IconButton } from "../IconButton";
import styles from "./Drawer.module.css";

export type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible title for the dialog. */
  title: string;
  children: ReactNode;
  /** Element that mounts the drawer portal region (fixed overlay). */
  className?: string;
  /** Optional close control label. */
  closeLabel?: string;
  /** Extra props on the dialog panel. */
  panelProps?: HTMLAttributes<HTMLDivElement>;
  /** Replaces the text title in the header (dialog still uses `title` for the accessible name). */
  header?: ReactNode;
  /** Trailing header slot (e.g. a two-step confirm action). */
  headerAction?: ReactNode;
  /** Close control side. `end` puts the title at the start and a right chevron on the right. */
  closeSide?: "start" | "end";
  /** Rendered over the scrim, behind the sliding panel (left of a side sheet). */
  overlay?: ReactNode;
};

/**
 * Full-viewport drawer sliding in from the right (explorer mobile menu).
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  children,
  className,
  closeLabel = "Close",
  panelProps,
  header,
  headerAction,
  closeSide = "start",
  overlay,
}: DrawerProps) {
  const titleId = useId();
  const panelId = useId();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }

    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  const visible = open && entered;

  return (
    <div
      className={cn(styles.root, className)}
      data-open={visible ? "true" : undefined}
      aria-hidden={visible ? undefined : true}
    >
      <button
        type="button"
        className={styles.scrim}
        aria-label={closeLabel}
        tabIndex={visible ? 0 : -1}
        onClick={() => onOpenChange(false)}
      />
      {overlay ? <div className={styles.overlay}>{overlay}</div> : null}
      <div
        id={panelId}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={header ? title : undefined}
        aria-labelledby={header ? undefined : titleId}
        {...panelProps}
      >
        <div className={styles.header} data-close={closeSide}>
          {closeSide === "start" ? (
            <IconButton
              className={styles.back}
              aria-label={closeLabel}
              size="md"
              tabIndex={visible ? 0 : -1}
              onClick={() => onOpenChange(false)}
            >
              <ChevronRightIcon />
            </IconButton>
          ) : null}
          {header ? (
            <div className={styles.titleSlot}>{header}</div>
          ) : (
            <Heading
              id={titleId}
              className={styles.title}
              level={2}
              size="md"
              weight="bold"
              tracking="normal"
            >
              {title}
            </Heading>
          )}
          <div className={styles.headerEnd}>{headerAction}</div>
          {closeSide === "end" ? (
            <IconButton
              className={styles.back}
              aria-label={closeLabel}
              size="md"
              tabIndex={visible ? 0 : -1}
              onClick={() => onOpenChange(false)}
            >
              <ChevronRightIcon />
            </IconButton>
          ) : null}
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M6 3.5 10.5 8 6 12.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
