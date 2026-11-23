"use client";

import type { ReactNode } from "react";
import { cn } from "../cn";
import styles from "./AdminDataTable.module.css";

export type AdminDataTableColumn<T> = {
  id: string;
  header: ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  align?: "start" | "end";
  hideOnMobile?: boolean;
  render: (row: T) => ReactNode;
};

export type AdminDataTableProps<T> = {
  ariaLabel: string;
  columns: AdminDataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  getRowClassName?: (row: T) => string | undefined;
  getRowProps?: (row: T) => Record<string, string | boolean | undefined>;
  pending?: boolean;
  emptyMessage?: ReactNode;
  noResultsMessage?: ReactNode;
  loadingMessage?: ReactNode;
  loading?: boolean;
  tbodyFooter?: ReactNode;
};

export function AdminDataTable<T>({
  ariaLabel,
  columns,
  rows,
  getRowKey,
  getRowClassName,
  getRowProps,
  pending = false,
  emptyMessage,
  noResultsMessage,
  loadingMessage,
  loading = false,
  tbodyFooter,
}: AdminDataTableProps<T>) {
  if (loading && loadingMessage) {
    return <p className={styles.loading}>{loadingMessage}</p>;
  }

  if (emptyMessage) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  if (noResultsMessage) {
    return <p className={styles.empty}>{noResultsMessage}</p>;
  }

  return (
    <section className={styles.scroll} aria-label={ariaLabel} data-pending={pending || undefined}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                className={cn(
                  column.headerClassName,
                  column.hideOnMobile && styles.desktopOnly,
                  column.align === "end" && styles.alignEnd,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="adminStagger">
          {rows.map((row) => {
            const rowProps = getRowProps?.(row) ?? {};
            return (
              <tr key={getRowKey(row)} className={cn("adminRise", getRowClassName?.(row))} {...rowProps}>
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      column.cellClassName,
                      column.hideOnMobile && styles.desktopOnly,
                      column.align === "end" && styles.alignEnd,
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
          {tbodyFooter}
        </tbody>
      </table>
    </section>
  );
}

export { styles as adminTableStyles };
