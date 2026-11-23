"use client";

import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import styles from "./Select.module.css";

export type SelectSize = "sm" | "md" | "lg";

export type SelectOption = { value: string; label: ReactNode; disabled?: boolean };

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  description?: string;
  error?: string | boolean;
  size?: SelectSize;
  options: SelectOption[];
  placeholder?: string;
  /** Trailing control in the label row (e.g. a field help button). */
  labelEnd?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    description,
    error,
    size = "md",
    options,
    placeholder,
    labelEnd,
    className,
    id,
    disabled,
    required,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const selectId = id ?? reactId;
  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : undefined;
  const descId = description ? `${selectId}-desc` : undefined;
  const errId = `${selectId}-err`;

  return (
    <div className={cn(styles.field, className)}>
      {label && (
        <span className={styles.labelRow}>
          <label htmlFor={selectId} className={styles.label}>
            {label}
            {required && <span className={styles.required} aria-hidden>*</span>}
          </label>
          {labelEnd}
        </span>
      )}
      <span className={styles.control} data-size={size} data-invalid={hasError || undefined} data-disabled={disabled || undefined}>
        <select
          ref={ref}
          id={selectId}
          className={styles.select}
          disabled={disabled}
          required={required}
          aria-invalid={hasError || undefined}
          aria-describedby={cn(descId, hasError ? errId : undefined) || undefined}
          {...rest}
        >
          {placeholder != null && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      </span>
      {description && <span id={descId} className={styles.description}>{description}</span>}
      {errorMessage && <span id={errId} className={styles.error} role="alert">{errorMessage}</span>}
    </div>
  );
});
