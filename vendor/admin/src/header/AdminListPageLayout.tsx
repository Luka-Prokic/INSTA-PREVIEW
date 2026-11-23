"use client";

import type { ReactNode } from "react";
import { AdminPageHeader } from "./AdminPageHeader";
import styles from "./AdminListPageLayout.module.css";

export function AdminListPageLayout({
  title,
  addHref,
  addLabel,
  addDisabled,
  headerAction,
  search,
  belowHeader,
  subtitle,
  showDemoTag,
  children,
}: {
  title: string;
  addHref?: string;
  addLabel?: string;
  addDisabled?: boolean;
  headerAction?: ReactNode;
  search?: ReactNode;
  belowHeader?: ReactNode;
  subtitle?: ReactNode;
  showDemoTag?: boolean;
  children: ReactNode;
}) {
  const band = Boolean(belowHeader);
  return (
    <section className={styles.page}>
      <div className={band ? styles.band : undefined}>
        {band ? <style>{`.${styles.band} { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }`}</style> : null}
        <AdminPageHeader
          title={title}
          addHref={addHref}
          addLabel={addLabel}
          addDisabled={addDisabled}
          headerAction={headerAction}
          search={search}
          showDemoTag={showDemoTag}
          sticky={!band}
        />
        {belowHeader}
      </div>
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      {children}
    </section>
  );
}
