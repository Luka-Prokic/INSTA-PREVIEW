"use client";

import { IonIcon, readStoredAdminTheme, type AdminTheme } from "@/lib/caka-admin";
import { applyPreviewTheme } from "@/features/theme/applyPreviewTheme";
import { useEffect, useState } from "react";
import flip from "./FlipToggle.module.css";
import styles from "./Shell.module.css";
import themeStyles from "./ThemeToggle.module.css";

/** CAKA-CMS Appearance “Theme” row — Light / Dark segment at the sidebar foot. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<AdminTheme>("light");
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState(false);

  useEffect(() => {
    setTheme(readStoredAdminTheme());
    setReady(true);
    const frame = requestAnimationFrame(() => setLive(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const index = ready && theme === "dark" ? 1 : 0;

  return (
    <ul className={styles.card}>
      <li>
        <button
          type="button"
          className={styles.row}
          aria-pressed={ready ? theme === "dark" : undefined}
          aria-label={`Theme, ${theme === "dark" ? "Dark" : "Light"}`}
          onClick={() => {
            const next: AdminTheme = theme === "dark" ? "light" : "dark";
            setTheme(next);
            applyPreviewTheme(next);
          }}
        >
          <span className={themeStyles.leading}>
            <span className={themeStyles.mark} style={{ background: "#5856d6" }} aria-hidden>
              <IonIcon name="moon-outline" />
            </span>
            <span>Theme</span>
          </span>
          <span
            className={`${flip.root} ${themeStyles.segment}`}
            data-index={index}
            data-ready={ready ? "" : undefined}
            data-live={live ? "" : undefined}
            aria-hidden
          >
            <span className={flip.faces}>
              <span>Light</span>
              <span>Dark</span>
            </span>
            <span className={flip.thumb}>
              <span className={flip.faces}>
                <span>Light</span>
                <span>Dark</span>
              </span>
            </span>
          </span>
        </button>
      </li>
    </ul>
  );
}
