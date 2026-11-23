"use client";

import { mountPointerSwipe } from "@/lib/caka-admin";
import { usePresence } from "@/hooks/usePresence";
import { useWorkspace } from "@/features/planner/store";
import { useEffect, useRef } from "react";
import { AppSidebar } from "./AppSidebar";
import { ConnectForm } from "./ConnectForm";
import { PreviewStage } from "./PreviewStage";
import { PreviewToolbar } from "./PreviewToolbar";
import styles from "./Shell.module.css";

export function PreviewApp() {
  const { sidebarOpen, connectOpen, setConnectOpen, snapshot, hydrated } = useWorkspace();
  const dialogOpen = Boolean(connectOpen && snapshot);
  const dialog = usePresence(dialogOpen);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    return mountPointerSwipe(node);
  }, []);

  return (
    <div ref={rootRef} className={`adminRoot ${styles.root}`} data-rail={!sidebarOpen || undefined}>
      <AppSidebar />
      <div className={styles.main}>
        <PreviewToolbar />
        <div className={styles.previewArea}>
          {!hydrated ?
            <div className={styles.empty}>
              <p className={styles.muted}>Loading workspace…</p>
            </div>
          : connectOpen && !snapshot ?
            <div className={styles.empty}>
              <ConnectForm variant="panel" />
            </div>
          : <>
              <PreviewStage />
              {dialog.mounted ?
                <ConnectForm
                  variant="dialog"
                  closing={dialog.closing}
                  onClose={() => setConnectOpen(false)}
                />
              : null}
            </>
          }
        </div>
      </div>
    </div>
  );
}
