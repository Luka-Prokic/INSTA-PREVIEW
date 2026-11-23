"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./Tooltip.module.css";

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  placement?: "top" | "bottom";
};

/** Lightweight hover/focus tooltip. Prefer short content. */
export function Tooltip({ content, children, className, placement = "top" }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span
      className={cn(styles.root, className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open && (
        <span id={id} role="tooltip" className={cn(styles.tip, placement === "bottom" && styles.tipBottom)}>
          {content}
        </span>
      )}
    </span>
  );
}
