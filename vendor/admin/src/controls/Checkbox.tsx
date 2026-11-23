"use client";

import type { ReactNode } from "react";
import { cn } from "../cn";
import styles from "./Controls.module.css";

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  ariaLabel,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <label className={cn(styles.check, className)}>
      <input
        className={styles.checkInput}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={label ? undefined : ariaLabel}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.box} aria-hidden />
      {label ? <span className={styles.checkText}>{label}</span> : null}
    </label>
  );
}
