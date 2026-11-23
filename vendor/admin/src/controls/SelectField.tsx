"use client";

import styles from "./Controls.module.css";

export function SelectField({
  id,
  name,
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
}: {
  id?: string;
  name?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div className={styles.selectWrap}>
      <select
        id={id}
        name={name}
        className={styles.select}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className={styles.chevron} aria-hidden />
    </div>
  );
}
