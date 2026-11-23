"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import styles from "./AdminNotice.module.css";

export type AdminNoticeInput = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
};

type AdminNoticeContextValue = {
  showNotice: (notice: AdminNoticeInput) => void;
  dismissNotice: () => void;
};

const AdminNoticeContext = createContext<AdminNoticeContextValue | null>(null);

export function AdminNoticeProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<AdminNoticeInput | null>(null);

  const dismissNotice = useCallback(() => setNotice(null), []);
  const showNotice = useCallback((next: AdminNoticeInput) => setNotice(next), []);
  const value = useMemo(() => ({ showNotice, dismissNotice }), [showNotice, dismissNotice]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(dismissNotice, notice.durationMs ?? 4200);
    return () => window.clearTimeout(timer);
  }, [notice, dismissNotice]);

  return (
    <AdminNoticeContext.Provider value={value}>
      {children}
      {notice ? (
        <div className={styles.notice} role="status">
          <p>{notice.message}</p>
          {notice.actionLabel && notice.onAction ? (
            <button
              type="button"
              onClick={() => {
                notice.onAction?.();
                dismissNotice();
              }}
            >
              {notice.actionLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </AdminNoticeContext.Provider>
  );
}

export function useAdminNotice(): AdminNoticeContextValue {
  const value = useContext(AdminNoticeContext);
  if (!value) throw new Error("useAdminNotice must be used within AdminNoticeProvider");
  return value;
}
