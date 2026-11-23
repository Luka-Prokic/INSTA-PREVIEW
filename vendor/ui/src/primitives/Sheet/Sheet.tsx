"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";
import { Heading } from "../Heading";
import { IconButton } from "../IconButton";
import styles from "./Sheet.module.css";

export type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  children: ReactNode;
  closeLabel?: string;
  className?: string;
  bodyClassName?: string;
};

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Full-viewport pull-down sheet. Clip lives on the inner panel (top-layer
 * clip on `<dialog>` is unreliable). Same drop-sheet engine as explorer menus.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  children,
  closeLabel = "Close",
  className,
  bodyClassName,
}: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !mounted) return;

    const clearCloseTimer = () => {
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };

    if (open) {
      clearCloseTimer();
      if (!dialog.open) {
        dialog.showModal();
        dialog.focus({ preventScroll: true });
      }
      setSheetOpen(false);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setSheetOpen(true));
      });
      return () => cancelAnimationFrame(frame);
    }

    setSheetOpen(false);
    if (!dialog.open) return;

    const sheet = sheetRef.current;
    if (!sheet || prefersReducedMotion()) {
      dialog.close();
      return;
    }

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      sheet.removeEventListener("transitionend", onEnd);
      clearCloseTimer();
      if (dialog.open) dialog.close();
    };
    const onEnd = (event: TransitionEvent) => {
      if (event.target !== sheet || event.propertyName !== "clip-path") return;
      finish();
    };
    sheet.addEventListener("transitionend", onEnd);

    const durationMs = (Number.parseFloat(getComputedStyle(sheet).transitionDuration) || 0) * 1000;
    if (durationMs <= 0) {
      finish();
      return () => sheet.removeEventListener("transitionend", onEnd);
    }

    closeTimerRef.current = window.setTimeout(finish, durationMs + 40);
    return () => {
      sheet.removeEventListener("transitionend", onEnd);
      clearCloseTimer();
    };
  }, [open, mounted]);

  if (!mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className={cn(styles.dialog, className)}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onOpenChange(false);
      }}
    >
      <div ref={sheetRef} className={styles.sheet} data-sheet={sheetOpen || undefined}>
        <div className={styles.panel}>
          <header className={styles.header}>
            <Heading id={titleId} level={2} size="md" weight="semibold">
              {title}
            </Heading>
            <IconButton
              aria-label={closeLabel}
              variant="ghost"
              size="md"
              radius="sharp"
              onClick={() => onOpenChange(false)}
            >
              <CloseGlyph />
            </IconButton>
          </header>
          <div className={cn(styles.body, bodyClassName)}>{children}</div>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="2"
        d="M5 5l14 14M19 5L5 19"
      />
    </svg>
  );
}
