import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./TwoColumns.module.css";

export type TwoColumnsProps = HTMLAttributes<HTMLDivElement> & {
  /** Left column (or top when stacked). */
  start: ReactNode;
  /** Right column (or bottom when stacked). */
  end: ReactNode;
  /**
   * Divider tone.
   * `muted` (default) - hairline on canvas; `onInk` - light hairline on dark bands.
   */
  dividerTone?: "muted" | "onInk";
  /** Hide the rule when columns stack. Default `false`. */
  hideHrOnWrap?: boolean;
  /**
   * Stack below this breakpoint.
   * `medium` (48rem) default; `large` (64rem) for editorial splits.
   */
  stackBelow?: "medium" | "large";
};

/**
 * Two equal columns with a vertical rule.
 * Stacks below 48rem by default, or 64rem when `stackBelow="large"`.
 */
export function TwoColumns({
  start,
  end,
  dividerTone = "muted",
  hideHrOnWrap = false,
  stackBelow = "medium",
  className,
  ...rest
}: TwoColumnsProps) {
  return (
    <div
      className={cn(
        styles.root,
        dividerTone === "onInk" && styles.dividerOnInk,
        hideHrOnWrap && styles.hideHrOnWrap,
        stackBelow === "large" && styles.stackBelowLarge,
        className,
      )}
      {...rest}
    >
      <div className={styles.col}>{start}</div>
      <hr className={styles.rule} aria-hidden />
      <div className={styles.col}>{end}</div>
    </div>
  );
}
