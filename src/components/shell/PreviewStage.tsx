"use client";

import { useWorkspace } from "@/features/planner/store";
import { DeviceCarousel } from "./DeviceCarousel";
import styles from "./Shell.module.css";

export function PreviewStage() {
  const {
    snapshot,
    planned,
    editMode,
    previewTab,
    setPreviewTab,
    status,
    error,
    setConnectOpen,
  } = useWorkspace();

  if (!snapshot) {
    return (
      <div className={styles.empty}>
        <div style={{ maxWidth: 420, textAlign: "center", display: "grid", gap: 12 }}>
          <p className={styles.headerTitle}>Load an Instagram profile</p>
          <p className={styles.muted}>
            Enter a public @username to import bio, avatar, links, posts, and Reels. An access token is optional.
          </p>
          <button type="button" className={styles.primaryBtn} onClick={() => setConnectOpen(true)}>
            Connect profile
          </button>
          {error ? <p style={{ color: "var(--color-error)", margin: 0 }}>{error}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.stage}>
      {status === "loading" ?
        <div className={styles.loading}>
          <p className={styles.muted}>Importing profile…</p>
        </div>
      : null}
      <DeviceCarousel
        snapshot={snapshot}
        planned={planned}
        editMode={editMode}
        tab={previewTab}
        onTabChange={setPreviewTab}
      />
    </div>
  );
}
