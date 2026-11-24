"use client";

import { IonIcon } from "@/lib/caka-admin";
import { useEffect, useState } from "react";
import { useWorkspace } from "@/features/planner/store";
import { AddMediaModal } from "./AddMediaModal";
import { ManualImportModal } from "./ManualImportModal";
import { AddPostIcon } from "./PlanIcons";
import { FlipToggle } from "./FlipToggle";
import { PhoneControls } from "./PhoneControls";
import { PlannedList } from "./PlannedList";
import { SettingsCards } from "./SettingsCards";
import { SidebarSection } from "./SidebarSection";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Shell.module.css";
import sideStyles from "./AppSidebar.module.css";

export function AppSidebar() {
  const {
    sidebarOpen,
    setSidebarOpen,
    snapshot,
    username,
    planned,
    setConnectOpen,
    clearPreview,
    profileEditOpen,
    setProfileEditOpen,
    editMode,
    setEditMode,
  } = useWorkspace();
  const [addOpen, setAddOpen] = useState(false);
  const [clearArmed, setClearArmed] = useState(false);
  const contentCount = (snapshot?.fields.media.value?.length ?? 0) + planned.length;
  const contentEmpty = contentCount === 0;

  useEffect(() => {
    if (!clearArmed) return;
    const timer = window.setTimeout(() => setClearArmed(false), 3200);
    return () => window.clearTimeout(timer);
  }, [clearArmed]);

  useEffect(() => {
    setClearArmed(false);
  }, [username, snapshot?.fetchedAt]);

  useEffect(() => {
    if (!clearArmed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setClearArmed(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearArmed]);

  return (
    <aside className={styles.sidebar}>
      <div className={sideStyles.layers} data-rail={!sidebarOpen || undefined}>
        <div className={sideStyles.rail} aria-hidden={sidebarOpen || undefined} inert={sidebarOpen || undefined}>
          <div className={sideStyles.railActions}>
            <button type="button" className={sideStyles.railIcon} aria-label="Expand sidebar" onClick={() => setSidebarOpen(true)}>
              <IonIcon name="menu-outline" />
            </button>
            <button
              type="button"
              className={sideStyles.railIcon}
              aria-label="Connect profile"
              onClick={() => setConnectOpen(true)}
            >
              <IonIcon name="link-outline" />
            </button>
            <button
              type="button"
              className={sideStyles.railIcon}
              aria-label="Add content"
              disabled={!snapshot}
              onClick={() => setAddOpen(true)}
            >
              <AddPostIcon />
            </button>
          </div>
          {!contentEmpty ?
            <div className={sideStyles.railContent}>
              <PlannedList variant="rail" />
            </div>
          : null}
        </div>

        <div className={sideStyles.inner} aria-hidden={!sidebarOpen || undefined} inert={!sidebarOpen || undefined}>
          <div className={sideStyles.brand}>
            <p className={sideStyles.brandTitle}>GRID</p>
            <button type="button" className={styles.iconBtn} aria-label="Collapse sidebar" onClick={() => setSidebarOpen(false)}>
              <IonIcon name="chevron-back-outline" />
            </button>
          </div>

          <div className={sideStyles.scroll}>
            <SettingsCards>
              <SidebarSection title="Profile">
                <ul className={styles.card}>
                  <li>
                    <button type="button" className={`${styles.row} ${styles.rowBlue}`} onClick={() => setConnectOpen(true)}>
                      {username ? `Connected @${username}` : "Connect profile"}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={`${styles.row} ${styles.rowCenter}`}
                      onClick={() => setProfileEditOpen(true)}
                    >
                      Edit profile
                    </button>
                  </li>
                  {username ?
                    <li>
                      <button
                        type="button"
                        className={`${styles.row} ${styles.rowDanger}`}
                        data-armed={clearArmed || undefined}
                        aria-label={clearArmed ? "Confirm clear" : "Clear"}
                        onClick={() => {
                          if (clearArmed) {
                            setClearArmed(false);
                            void clearPreview();
                            return;
                          }
                          setClearArmed(true);
                        }}
                      >
                        <span key={clearArmed ? "armed" : "idle"} className={styles.swap}>
                          {clearArmed ? "Confirm clear" : "Clear"}
                        </span>
                      </button>
                    </li>
                  : null}
                </ul>
              </SidebarSection>

              <SidebarSection title="Plan">
                <ul className={styles.card}>
                  <li>
                    <button type="button" className={styles.row} disabled={!snapshot} onClick={() => setAddOpen(true)}>
                      <span className={styles.rowLabel}>
                        <AddPostIcon />
                        Add
                      </span>
                    </button>
                  </li>
                  <li>
                    <div
                      className={`${styles.row} ${styles.rowStatic}`}
                      onClick={(event) => {
                        if ((event.target as HTMLElement).closest("button")) return;
                        setEditMode(!editMode);
                      }}
                    >
                      <span className={styles.rowLabel}>Preview marks</span>
                      <FlipToggle
                        ariaLabel="Preview marks"
                        value={editMode ? "marks" : "clean"}
                        onChange={(next) => setEditMode(next === "marks")}
                        options={[
                          { value: "marks", label: "Marks" },
                          { value: "clean", label: "Clean" },
                        ]}
                      />
                    </div>
                  </li>
                </ul>
              </SidebarSection>

              <SidebarSection
                title="Content"
                collapsible={!contentEmpty}
                summary={String(contentCount)}
              >
                {contentEmpty ? undefined : <PlannedList />}
              </SidebarSection>

              <PhoneControls />

              <ThemeToggle />
            </SettingsCards>
          </div>
        </div>
      </div>

      <AddMediaModal open={addOpen} onOpenChange={setAddOpen} />
      <ManualImportModal open={profileEditOpen} onOpenChange={setProfileEditOpen} />
    </aside>
  );
}
