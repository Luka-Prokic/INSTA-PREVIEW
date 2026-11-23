"use client";

import {
  forwardRef,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../../utils/cn";
import styles from "./Switch.module.css";

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  {
    checked,
    defaultChecked = false,
    onCheckedChange,
    label,
    className,
    disabled,
    id,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const switchId = id ?? reactId;
  const [uncontrolled, setUncontrolled] = useState(defaultChecked);
  const isOn = checked ?? uncontrolled;

  return (
    <div className={cn(styles.root, className)} data-disabled={disabled || undefined}>
      <button
        ref={ref}
        id={switchId}
        type="button"
        role="switch"
        aria-checked={isOn}
        disabled={disabled}
        className={styles.track}
        data-checked={isOn ? "true" : undefined}
        onClick={(e) => {
          rest.onClick?.(e);
          const next = !isOn;
          if (checked === undefined) setUncontrolled(next);
          onCheckedChange?.(next);
        }}
        {...rest}
      >
        <span className={styles.thumb} aria-hidden />
      </button>
      {label != null && (
        <label htmlFor={switchId} className={styles.label}>
          {label}
        </label>
      )}
    </div>
  );
});
