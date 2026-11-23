"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../../utils/cn";
import styles from "./Radio.module.css";

type RadioGroupContextValue = {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
};

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export type RadioGroupProps = {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  label?: ReactNode;
  children: ReactNode;
  className?: string;
  orientation?: "vertical" | "horizontal";
  "aria-label"?: string;
};

export function RadioGroup({
  name,
  value,
  onChange,
  disabled,
  label,
  children,
  className,
  orientation = "vertical",
  "aria-label": ariaLabel,
}: RadioGroupProps) {
  const autoName = useId();
  const groupName = name ?? autoName;

  return (
    <fieldset
      className={cn(styles.group, className)}
      data-orientation={orientation}
      disabled={disabled}
      aria-label={label == null ? ariaLabel : undefined}
    >
      {label != null && <legend className={styles.legend}>{label}</legend>}
      <RadioGroupContext.Provider value={{ name: groupName, value, onChange, disabled }}>
        <div className={styles.options}>{children}</div>
      </RadioGroupContext.Provider>
    </fieldset>
  );
}

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: ReactNode;
  value: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, value, className, disabled, id, ...rest },
  ref,
) {
  const ctx = useContext(RadioGroupContext);
  const reactId = useId();
  const inputId = id ?? reactId;
  const name = ctx?.name;
  const checked = ctx?.value != null ? ctx.value === value : rest.checked;
  const isDisabled = disabled || ctx?.disabled;

  return (
    <label className={cn(styles.option, className)} htmlFor={inputId} data-disabled={isDisabled || undefined}>
      <input
        ref={ref}
        id={inputId}
        type="radio"
        className={styles.input}
        name={name}
        value={value}
        checked={checked}
        disabled={isDisabled}
        onChange={(e) => {
          rest.onChange?.(e);
          if (e.target.checked) ctx?.onChange?.(value);
        }}
        {...rest}
      />
      <span className={styles.dot} aria-hidden />
      {label != null && <span className={styles.text}>{label}</span>}
    </label>
  );
});
