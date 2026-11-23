import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./Button.module.css";

export type ButtonVariant = "solid" | "outline" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonTone = "neutral" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. Defaults to `solid`. */
  variant?: ButtonVariant;
  /** Control height and padding. Defaults to `md`. */
  size?: ButtonSize;
  /** Color intent. Defaults to `neutral`. */
  tone?: ButtonTone;
  /** Show a spinner and block interaction without collapsing layout. */
  loading?: boolean;
  /** Stretch to the full width of the container. */
  fullWidth?: boolean;
  /** Element rendered before the label. */
  iconStart?: ReactNode;
  /** Element rendered after the label. */
  iconEnd?: ReactNode;
  /**
   * Icon-only button. Requires an accessible name via `aria-label`.
   * Hides text spacing and renders a square control.
   */
  iconOnly?: boolean;
}

/**
 * Button is the primary action primitive. It renders a native `<button>`,
 * supports variants/sizes/tones, a non-collapsing loading state, and forwards
 * its ref. Labels are provided via children for free composition.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "solid",
    size = "md",
    tone = "neutral",
    loading = false,
    fullWidth = false,
    iconStart,
    iconEnd,
    iconOnly = false,
    type = "button",
    disabled = false,
    className,
    children,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      data-variant={variant}
      data-size={size}
      data-tone={tone}
      data-loading={loading || undefined}
      className={cn(
        styles.button,
        fullWidth && styles.fullWidth,
        iconOnly && styles.iconOnly,
        className,
      )}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {iconStart && (
        <span
          className={cn(styles.icon, loading && styles.loadingLabel)}
          aria-hidden="true"
        >
          {iconStart}
        </span>
      )}
      {!iconOnly && children != null && (
        <span className={cn(styles.label, loading && styles.loadingLabel)}>
          {children}
        </span>
      )}
      {iconOnly && (
        <span
          className={cn(styles.icon, loading && styles.loadingLabel)}
          aria-hidden="true"
        >
          {children}
        </span>
      )}
      {iconEnd && (
        <span
          className={cn(styles.icon, loading && styles.loadingLabel)}
          aria-hidden="true"
        >
          {iconEnd}
        </span>
      )}
    </button>
  );
});
