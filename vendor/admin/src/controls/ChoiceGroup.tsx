"use client";

import styles from "./Controls.module.css";

export function ChoiceGroup({
  name,
  value,
  onChange,
  options,
  ariaLabel,
  disabled = false,
}: {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; ariaLabel?: string }[];
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className={styles.choice} role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => (
        <label key={option.value} className={styles.choiceOption}>
          <input
            className={styles.choiceInput}
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            disabled={disabled}
            aria-label={option.ariaLabel}
            onChange={() => onChange(option.value)}
          />
          <span className={styles.choiceText}>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
