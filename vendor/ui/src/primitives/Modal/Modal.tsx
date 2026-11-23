"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../../utils/cn";
import { Heading } from "../Heading";
import { IconButton } from "../IconButton";
import styles from "./Modal.module.css";

export type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  /** Footer actions slot */
  footer?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "full";
  closeLabel?: string;
  panelProps?: HTMLAttributes<HTMLDivElement>;
  /** Rendered inside the dialog, behind the panel (viewport overlay). */
  overlay?: ReactNode;
  /** Where the panel sits in the viewport. Defaults to `center`. */
  placement?: "center" | "top" | "top-start" | "top-end" | "bottom-start";
};

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function transitionDurationMs(element: HTMLElement): number {
  const raw = getComputedStyle(element).transitionDuration.split(",")[0]?.trim() ?? "0s";
  const value = Number.parseFloat(raw) || 0;
  return raw.endsWith("ms") ? value : value * 1000;
}

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  footer,
  className,
  size = "md",
  closeLabel = "Close",
  panelProps,
  overlay,
  placement = "center",
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [entered, setEntered] = useState(false);
  const { className: panelClassName, ...panelRest } = panelProps ?? {};

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
      if (prefersReducedMotion()) {
        setEntered(true);
        return;
      }
      setEntered(false);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setEntered(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }

    setEntered(false);
    if (!dialog.open) return;

    const panel = panelRef.current;
    if (!panel || prefersReducedMotion()) {
      dialog.close();
      return;
    }

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      panel.removeEventListener("transitionend", onEnd);
      if (dialog.open) dialog.close();
    };
    const onEnd = (event: TransitionEvent) => {
      if (event.target !== panel) return;
      if (event.propertyName !== "transform") return;
      finish();
    };
    panel.addEventListener("transitionend", onEnd);

    const durationMs = transitionDurationMs(panel);
    if (durationMs <= 0) {
      finish();
      return () => panel.removeEventListener("transitionend", onEnd);
    }

    const timeout = window.setTimeout(finish, durationMs + 40);
    return () => {
      panel.removeEventListener("transitionend", onEnd);
      window.clearTimeout(timeout);
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={cn(styles.dialog, className)}
      data-size={size}
      data-placement={placement}
      data-entered={entered || undefined}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onOpenChange(false);
      }}
    >
      {overlay ? (
        <div className={styles.overlay} onClick={(event) => event.stopPropagation()}>
          {overlay}
        </div>
      ) : null}
      <div
        ref={panelRef}
        className={cn(styles.panel, panelClassName)}
        {...panelRest}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <Heading id={titleId} level={2} size="md" weight="semibold">
            {title}
          </Heading>
          <IconButton
            type="button"
            aria-label={closeLabel}
            variant="ghost"
            size="md"
            radius="sharp"
            onClick={(event) => {
              event.stopPropagation();
              onOpenChange(false);
            }}
          >
            <CloseGlyph />
          </IconButton>
        </div>
        <div className={styles.body}>{children}</div>
        {footer != null && <div className={styles.footer}>{footer}</div>}
      </div>
    </dialog>
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
