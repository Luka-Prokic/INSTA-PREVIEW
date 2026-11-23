"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Button, type ButtonSize, type ButtonTone, type ButtonVariant } from "../Button";
import styles from "./ConfirmAction.module.css";

export type ConfirmActionProps = {
  /** Idle label (first click arms the control). Used as the accessible name in `icon` chrome. */
  label: ReactNode;
  /** Armed label (second click runs `onConfirm`). Used as the accessible name in `icon` chrome. */
  confirmLabel: ReactNode;
  onConfirm: () => void;
  disabled?: boolean;
  /** Auto-disarm after this many ms. Defaults to 4000. */
  timeoutMs?: number;
  size?: ButtonSize;
  /** Button look, or `icon` for a trash → double-check confirm control. Defaults to `ghost`. */
  variant?: ButtonVariant | "icon";
  confirmVariant?: ButtonVariant;
  tone?: ButtonTone;
  confirmTone?: ButtonTone;
  className?: string;
};

function accessibleName(node: ReactNode): string | undefined {
  return typeof node === "string" ? node : undefined;
}

/**
 * Two-step action: first click asks for confirmation, second click commits.
 * Blur, Escape, timeout, or `disabled` returns it to idle.
 */
export function ConfirmAction({
  label,
  confirmLabel,
  onConfirm,
  disabled = false,
  timeoutMs = 4000,
  size = "sm",
  variant = "ghost",
  confirmVariant,
  tone = "neutral",
  confirmTone = "danger",
  className,
}: ConfirmActionProps) {
  const [armed, setArmed] = useState(false);
  const icon = variant === "icon";
  const buttonVariant: ButtonVariant = icon
    ? "ghost"
    : armed
      ? (confirmVariant ?? variant)
      : variant;

  useEffect(() => {
    if (disabled) setArmed(false);
  }, [disabled]);

  useEffect(() => {
    if (!armed) return;
    const timeout = window.setTimeout(() => setArmed(false), timeoutMs);
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setArmed(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [armed, timeoutMs]);

  return (
    <Button
      type="button"
      className={cn(styles.button, className)}
      size={size}
      variant={buttonVariant}
      tone={armed ? confirmTone : tone}
      iconOnly={icon}
      disabled={disabled}
      aria-label={icon ? (armed ? accessibleName(confirmLabel) : accessibleName(label)) : undefined}
      aria-pressed={armed}
      data-armed={armed || undefined}
      data-chrome={icon ? "icon" : "text"}
      onBlur={() => setArmed(false)}
      onClick={(event) => {
        if (event.detail > 1) return;
        if (!armed) {
          setArmed(true);
          return;
        }
        setArmed(false);
        onConfirm();
      }}
    >
      {icon ? armed ? <CheckmarkDoneCircle /> : <TrashOutline /> : armed ? confirmLabel : label}
    </Button>
  );
}

function TrashOutline() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="20" height="20" aria-hidden="true">
      <path
        d="m112 112 20 320c.95 18.49 14.4 32 32 32h184c17.67 0 30.87-13.51 32-32l20-320"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path d="M80 112h352" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" />
      <path
        d="M192 112V72h0a23.93 23.93 0 0 1 24-24h80a23.93 23.93 0 0 1 24 24h0v40M256 176v224M184 176l8 224M328 176l-8 224"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </svg>
  );
}

function CheckmarkDoneCircle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M258.9 48C141.92 46.42 46.42 141.92 48 258.9c1.56 112.19 92.91 203.54 205.1 205.1 117 1.6 212.48-93.9 210.88-210.88C462.44 140.91 371.09 49.56 258.9 48zm-16.79 192.47l51.55-59a16 16 0 0124.1 21.06l-51.55 59a16 16 0 11-24.1-21.06zm-38.86 90.85a16 16 0 01-22.62 0l-47.95-48a16 16 0 1122.64-22.62l48 48a16 16 0 01-.07 22.62zm176.8-128.79l-111.88 128a16 16 0 01-11.51 5.47h-.54a16 16 0 01-11.32-4.69l-47.94-48a16 16 0 1122.64-22.62l29.8 29.83a8 8 0 0011.68-.39l95-108.66a16 16 0 0124.1 21.06z"
      />
    </svg>
  );
}
