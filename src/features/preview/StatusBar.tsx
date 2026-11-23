import type { PhoneFace } from "./devices";
import styles from "./StatusBar.module.css";

/** iOS cellular signal (4 bars). */
function Cellular() {
  return (
    <svg className={styles.icon} width="18" height="12" viewBox="0 0 18 12" aria-hidden>
      <path
        d="M1 8.5h2.2v3.2H1V8.5Zm4.6-2.5h2.2v5.7H5.6V6Zm4.6-2.6h2.2v8.3h-2.2V3.4ZM15 0h2.2v11.7H15V0Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** iOS Wi-Fi — three arcs + dot (stroke, not filled wedges). */
function Wifi() {
  return (
    <svg className={styles.icon} width="16" height="12" viewBox="0 0 16 12" aria-hidden>
      <path
        d="M1.2 4.05a9.2 9.2 0 0 1 13.6 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M3.35 6.15a6.15 6.15 0 0 1 9.3 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M5.55 8.2a3.1 3.1 0 0 1 4.9 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <circle cx="8" cy="10.35" r="1.05" fill="currentColor" />
    </svg>
  );
}

/** iOS battery — outline + 100% fill + tip. */
function Battery() {
  return (
    <svg className={styles.icon} width="27" height="13" viewBox="0 0 27 13" aria-hidden>
      <rect
        x="0.5"
        y="0.5"
        width="23"
        height="12"
        rx="3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.35"
      />
      <rect x="2" y="2" width="20" height="9" rx="2.2" fill="currentColor" />
      <path d="M25 4.2c1 .4 1.5 1.15 1.5 2.3S26 8.4 25 8.8V4.2Z" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export function StatusBar({
  time = "9:41",
  height = 59,
  face = "island",
}: {
  time?: string;
  height?: number;
  face?: PhoneFace;
}) {
  return (
    <div
      className={styles.bar}
      data-face={face}
      style={{ flexBasis: height, height }}
    >
      <span className={styles.time}>{time}</span>
      <span className={styles.icons} aria-hidden>
        <Cellular />
        <Wifi />
        <Battery />
      </span>
    </div>
  );
}
