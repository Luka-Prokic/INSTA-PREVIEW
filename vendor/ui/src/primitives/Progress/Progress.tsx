import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./Progress.module.css";

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: ReactNode;
  /** Show percentage text. Defaults true. */
  showValue?: boolean;
  /** `brand` uses signature red; default uses secondary (selected chrome). */
  tone?: "neutral" | "brand";
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { value, max = 100, label, showValue = true, tone = "neutral", className, ...rest },
  ref,
) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      ref={ref}
      className={cn(styles.root, className)}
      data-tone={tone === "brand" ? "brand" : undefined}
      {...rest}
    >
      {(label != null || showValue) && (
        <div className={styles.header}>
          {label != null && <span className={styles.label}>{label}</span>}
          {showValue && <span className={styles.value}>{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        className={styles.track}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={typeof label === "string" ? label : undefined}
      >
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
});
