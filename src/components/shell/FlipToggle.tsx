"use client";

import { useEffect, useState } from "react";
import styles from "./FlipToggle.module.css";

type Option = { value: string; label: string };

/** Whole-control flip (CAKA-CMS Theme / ModeTabs pattern) — click anywhere to switch. */
export function FlipToggle({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: [Option, Option];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const index = value === options[1].value ? 1 : 0;
  const [live, setLive] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setLive(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <button
      type="button"
      role="switch"
      className={styles.root}
      aria-checked={index === 1}
      aria-label={`${ariaLabel}, ${options[index].label}`}
      data-index={index}
      data-live={live || undefined}
      onClick={() => onChange(options[index === 0 ? 1 : 0].value)}
    >
      <span className={styles.faces} aria-hidden>
        <span>{options[0].label}</span>
        <span>{options[1].label}</span>
      </span>
      <span className={styles.thumb} aria-hidden>
        <span className={styles.faces}>
          <span>{options[0].label}</span>
          <span>{options[1].label}</span>
        </span>
      </span>
    </button>
  );
}
