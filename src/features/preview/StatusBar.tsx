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

/** iOS Wi-Fi. */
function Wifi() {
  return (
    <svg className={styles.icon} width="16" height="12" viewBox="0 0 16 12" aria-hidden>
      <path
        d="M8 9.7a1.35 1.35 0 1 1 0 2.7 1.35 1.35 0 0 1 0-2.7Zm-3.55-2.45a5.1 5.1 0 0 1 7.1 0l-1.1 1.15a3.5 3.5 0 0 0-4.9 0L4.45 7.25Zm-2.45-2.5a8.45 8.45 0 0 1 12 0l-1.1 1.15a6.9 6.9 0 0 0-9.8 0L2 4.75ZM.45 2.3a11.6 11.6 0 0 1 15.1 0l-1.1 1.15a10 10 0 0 0-12.9 0L.45 2.3Z"
        fill="currentColor"
      />
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
