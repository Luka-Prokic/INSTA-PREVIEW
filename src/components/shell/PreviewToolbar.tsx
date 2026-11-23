"use client";

import { IonIcon } from "@/lib/caka-admin";
import { useWorkspace } from "@/features/planner/store";
import { getActiveDeviceLabel } from "./DeviceCarousel";
import { ShareButton } from "./ShareButton";
import styles from "./Shell.module.css";

export function PreviewToolbar() {
  const { username, snapshot, sidebarOpen, setProfileEditOpen, viewMode, phoneModelId } =
    useWorkspace();

  const device = snapshot ? getActiveDeviceLabel(viewMode, phoneModelId) : null;

  return (
    <header className={styles.header}>
      <div className={styles.headerLead}>
        <p className={styles.headerTitle}>{username ? `@${username}` : "INSTA PREVIEW"}</p>
        {!sidebarOpen ?
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Edit profile"
            onClick={() => setProfileEditOpen(true)}
          >
            <IonIcon name="pencil-outline" />
          </button>
        : null}
      </div>

      {device ?
        <div className={styles.headerDevice} aria-live="polite">
          <p className={styles.headerDeviceName}>{device.name}</p>
          <p className={styles.headerDeviceMeta}>{device.subtitle}</p>
        </div>
      : <div className={styles.headerDevice} aria-hidden />}

      <div className={styles.headerControls}>
        {snapshot ? <ShareButton variant="icon" /> : null}
      </div>
    </header>
  );
}
