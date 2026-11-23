import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./TextField.module.css";

export type TextFieldSize = "sm" | "md" | "lg";

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  /** Visible label. Omit only if an external label / `aria-label` is provided. */
  label?: string;
  /** Helper text rendered below the control and linked via aria-describedby. */
  description?: string;
  /** Error message (string) or invalid flag (boolean). Sets aria-invalid. */
  error?: string | boolean;
  /** Control height. Defaults to `md`. */
  size?: TextFieldSize;
  /** Content rendered inside the control, before the input. */
  startAddon?: ReactNode;
  /** Content rendered inside the control, after the input. */
  endAddon?: ReactNode;
  /** Trailing control in the label row (e.g. a field help button). */
  labelEnd?: ReactNode;
  /** Wrapper className. Use `inputClassName` to style the input element. */
  className?: string;
  inputClassName?: string;
}

/**
 * TextField is the canonical single-line text input. It wires up label
 * association, description and error text (via aria-describedby), and
 * aria-invalid. It supports controlled and uncontrolled usage and forwards
 * its ref to the underlying `<input>`.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    description,
    error,
    size = "md",
    startAddon,
    endAddon,
    labelEnd,
    required,
    disabled,
    id,
    className,
    inputClassName,
    style,
    onKeyDown,
    ...inputProps
  },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = `${inputId}-error`;

  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : undefined;

  const describedBy =
    cn(description ? descriptionId : undefined, hasError ? errorId : undefined)?.replace(
      / +/g,
      " ",
    ) || undefined;

  return (
    <div className={cn(styles.field, className)} style={style}>
      {label && (
        <span className={styles.labelRow}>
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
          {required && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
          {labelEnd}
        </span>
      )}

      <span
        className={styles.control}
        data-size={size}
        data-invalid={hasError || undefined}
        data-disabled={disabled || undefined}
      >
        {startAddon && (
          <span className={styles.addon} aria-hidden="true">
            {startAddon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(styles.input, inputClassName)}
          disabled={disabled}
          required={required}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          {...inputProps}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented || event.key !== "Enter") return;
            event.preventDefault();
            event.currentTarget.blur();
          }}
        />
        {endAddon && (
          <span className={styles.addon} aria-hidden="true">
            {endAddon}
          </span>
        )}
      </span>

      {description && (
        <span id={descriptionId} className={styles.description}>
          {description}
        </span>
      )}
      {errorMessage && (
        <span id={errorId} className={styles.error} role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  );
});
