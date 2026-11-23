"use client";

import { IonIcon } from "@/lib/caka-admin";
import { useEffect, useId, useState, type KeyboardEvent, type ReactNode } from "react";
import styles from "./Shell.module.css";
import sideStyles from "./AppSidebar.module.css";

export function SidebarSection({
  title,
  children,
  defaultOpen = true,
  summary,
  collapsible = true,
  headerAction,
}: {
  title: string;
  children?: ReactNode;
  defaultOpen?: boolean;
  /** Shown in the header when collapsed, or always when not collapsible. */
  summary?: ReactNode;
  collapsible?: boolean;
  headerAction?: ReactNode;
}) {
  const [open, setOpen] = useState(collapsible ? defaultOpen : true);
  const [ready, setReady] = useState(false);
  const panelId = useId();
  const expanded = collapsible ? open : true;
  const hasBody = children != null && children !== false;
  const showSummary = summary != null && summary !== "" && (!collapsible || !expanded);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!collapsible) setOpen(true);
  }, [collapsible]);

  const toggle = () => {
    if (!collapsible) return;
    setOpen((v) => !v);
  };

  const onHeaderKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!collapsible) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  };

  return (
    <div
      className={sideStyles.block}
      data-collapsed={!expanded || undefined}
      data-ready={ready || undefined}
      data-static={!collapsible || undefined}
    >
      <div
        className={sideStyles.sectionHeader}
        role={collapsible ? "button" : undefined}
        tabIndex={collapsible ? 0 : undefined}
        aria-expanded={collapsible ? expanded : undefined}
        aria-controls={collapsible && hasBody ? panelId : undefined}
        onClick={collapsible ? toggle : undefined}
        onKeyDown={collapsible ? onHeaderKey : undefined}
      >
        <span className={styles.sectionTitle}>{title}</span>
        {headerAction ?
          <span
            className={sideStyles.sectionAction}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {headerAction}
          </span>
        : null}
        {showSummary ? <span className={sideStyles.sectionSummary}>{summary}</span> : null}
        {collapsible ?
          <span className={sideStyles.sectionChevron} data-open={expanded || undefined} aria-hidden>
            <IonIcon name="chevron-down-outline" />
          </span>
        : null}
      </div>

      {hasBody ?
        <div
          className={sideStyles.sectionCollapse}
          data-open={expanded || undefined}
          inert={!expanded || undefined}
        >
          <div className={sideStyles.sectionClip}>
            <div id={panelId} className={sideStyles.sectionBody} role="region" aria-hidden={!expanded}>
              {children}
            </div>
          </div>
        </div>
      : null}
    </div>
  );
}
