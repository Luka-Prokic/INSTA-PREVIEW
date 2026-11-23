"use client";

import {
  forwardRef,
  useId,
  useRef,
  useState,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "../../utils/cn";
import styles from "./TextArea.module.css";

export type TextAreaSize = "sm" | "md" | "lg";

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  /** Visible label. Omit only if an external label / `aria-label` is provided. */
  label?: string;
  /** Helper text rendered below the control and linked via aria-describedby. */
  description?: string;
  /** Error message (string) or invalid flag (boolean). Sets aria-invalid. */
  error?: string | boolean;
  /** Control density. Defaults to `md`. */
  size?: TextAreaSize;
  /** Minimum visible rows. Defaults to 4. */
  rows?: number;
  className?: string;
  textareaClassName?: string;
  /** Sticky copy control in the top-right of the field. */
  copyable?: boolean;
  copyLabel?: string;
  copiedLabel?: string;
}

/**
 * Multi-line text entry. Mirrors TextField labeling / error wiring on a native
 * `<textarea>` with iOS-safe font sizing.
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  {
    label,
    description,
    error,
    size = "md",
    rows = 4,
    required,
    disabled,
    id,
    className,
    textareaClassName,
    copyable = false,
    copyLabel = "Copy",
    copiedLabel = "Copied",
    style,
    value,
    defaultValue,
    ...textareaProps
  },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = `${inputId}-error`;
  const innerRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : undefined;

  const describedBy =
    cn(description ? descriptionId : undefined, hasError ? errorId : undefined)?.replace(
      / +/g,
      " ",
    ) || undefined;

  const setRefs = (node: HTMLTextAreaElement | null) => {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const copy = async () => {
    const text = innerRef.current?.value ?? "";
    if (!text || disabled) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const currentValue = typeof value === "string" ? value : innerRef.current?.value ?? String(defaultValue ?? "");
  const canCopy = Boolean(currentValue.trim());

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
        </span>
      )}

      <span
        className={styles.control}
        data-size={size}
        data-invalid={hasError || undefined}
        data-disabled={disabled || undefined}
        data-copyable={copyable || undefined}
      >
        <textarea
          ref={setRefs}
          id={inputId}
          className={cn(styles.textarea, textareaClassName)}
          disabled={disabled}
          required={required}
          rows={rows}
          value={value}
          defaultValue={defaultValue}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          {...textareaProps}
        />
        {copyable ? (
          <button
            type="button"
            className={styles.copy}
            aria-label={copied ? copiedLabel : copyLabel}
            disabled={disabled || !canCopy}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => void copy()}
          >
            {copied ? <CopiedGlyph /> : <CopyGlyph />}
          </button>
        ) : null}
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

function CopyGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="11"
        height="11"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M6 16H5.5A1.5 1.5 0 0 1 4 14.5v-9A1.5 1.5 0 0 1 5.5 4h9A1.5 1.5 0 0 1 16 5.5V6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function CopiedGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 12.5 9.5 17 19 7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="1.75"
      />
    </svg>
  );
}
