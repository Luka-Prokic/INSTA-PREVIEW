import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./Checkbox.module.css";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: ReactNode;
  description?: ReactNode;
  error?: string | boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, error, className, id, disabled, required, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : undefined;
  const descId = description ? `${inputId}-desc` : undefined;
  const errId = `${inputId}-err`;

  return (
    <div className={cn(styles.root, className)} data-disabled={disabled || undefined} data-invalid={hasError || undefined}>
      <label className={styles.label} htmlFor={inputId}>
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={styles.input}
          disabled={disabled}
          required={required}
          aria-invalid={hasError || undefined}
          aria-describedby={cn(descId, hasError ? errId : undefined) || undefined}
          {...rest}
        />
        <span className={styles.box} aria-hidden />
        {label != null && <span className={styles.text}>{label}</span>}
      </label>
      {description != null && (
        <span id={descId} className={styles.description}>
          {description}
        </span>
      )}
      {errorMessage && (
        <span id={errId} className={styles.error} role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  );
});
