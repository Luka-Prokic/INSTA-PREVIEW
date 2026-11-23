"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./Slider.module.css";

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  showValue?: boolean;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { label, showValue = true, className, id, min = 0, max = 100, value, defaultValue, disabled, style, onChange, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const numericMin = Number(min);
  const numericMax = Number(max);
  const display = Number(value ?? defaultValue ?? min);
  const range = numericMax - numericMin || 1;
  const progress = Math.min(100, Math.max(0, ((display - numericMin) / range) * 100));

  return (
    <div className={cn(styles.root, className)} data-disabled={disabled || undefined}>
      {(label != null || showValue) && (
        <div className={styles.header}>
          {label != null && (
            <label htmlFor={inputId} className={styles.label}>
              {label}
            </label>
          )}
          {showValue && <span className={styles.value}>{display}</span>}
        </div>
      )}
      <input
        ref={ref}
        id={inputId}
        type="range"
        className={styles.input}
        min={min}
        max={max}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        style={{ ...style, ["--slider-progress" as string]: `${progress}%` }}
        onChange={(e) => {
          const next = Number(e.target.value);
          const nextProgress = Math.min(100, Math.max(0, ((next - numericMin) / range) * 100));
          e.currentTarget.style.setProperty("--slider-progress", `${nextProgress}%`);
          onChange?.(e);
        }}
        {...rest}
      />
    </div>
  );
});
