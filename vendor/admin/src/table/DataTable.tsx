"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Checkbox } from "../controls/Checkbox";
import { cn } from "../cn";
import { usePointerTilt } from "../motion/usePointerTilt";
import styles from "./AdminDataTable.module.css";
import { listHref, type ListQuery } from "./list-params";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  sortable?: boolean;
  search?: boolean;
  hideable?: boolean;
  defaultHidden?: boolean;
  align?: "start" | "end";
  hideOnMobile?: boolean;
  className?: string;
  render: (row: T) => ReactNode;
};

export function DataTable<T>({
  tableId,
  ariaLabel,
  columns,
  rows,
  getRowKey,
  query,
  total,
  getRowClassName,
  emptyMessage = "Nothing here yet.",
  noResultsMessage = "No matches.",
  loading = false,
  loadingMessage = "Loading…",
  selectable = false,
  selectedIds,
  onSelectedChange,
}: {
  tableId: string;
  ariaLabel: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  query: ListQuery;
  total: number;
  getRowClassName?: (row: T) => string | undefined;
  emptyMessage?: ReactNode;
  noResultsMessage?: ReactNode;
  loading?: boolean;
  loadingMessage?: ReactNode;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectedChange?: (ids: string[]) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hidden, setHidden] = useState<string[]>(() => columns.filter((column) => column.defaultHidden).map((column) => column.id));

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(`cms_table_columns:${tableId}`);
      if (stored) setHidden(JSON.parse(stored) as string[]);
    } catch {
      /* ignore */
    }
  }, [tableId]);
  const [columnsOpen, setColumnsOpen] = useState(false);

  const tiltRef = useRef<HTMLDivElement>(null);
  usePointerTilt(tiltRef);
  const hideable = columns.filter((column) => column.hideable);
  const visible = columns.filter((column) => !hidden.includes(column.id));
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const searching = Boolean(query.q && query.col);
  const selected = useMemo(() => new Set(selectedIds ?? []), [selectedIds]);

  function persistHidden(next: string[]) {
    setHidden(next);
    try {
      window.localStorage.setItem(`cms_table_columns:${tableId}`, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function toggleColumn(id: string) {
    persistHidden(hidden.includes(id) ? hidden.filter((item) => item !== id) : [...hidden, id]);
  }

  function toggleAll(checked: boolean) {
    if (!onSelectedChange) return;
    const pageIds = rows.map(getRowKey);
    if (checked) onSelectedChange([...new Set([...(selectedIds ?? []), ...pageIds])]);
    else onSelectedChange((selectedIds ?? []).filter((id) => !pageIds.includes(id)));
  }

  function toggleRow(id: string, checked: boolean) {
    if (!onSelectedChange) return;
    const current = new Set(selectedIds ?? []);
    if (checked) current.add(id);
    else current.delete(id);
    onSelectedChange([...current]);
  }

  const current = new URLSearchParams(searchParams.toString());

  if (loading) return <p className={styles.loading}>{loadingMessage}</p>;
  if (!searching && total === 0) return <p className={styles.empty}>{emptyMessage}</p>;

  return (
    <div ref={tiltRef}>
      {hideable.length ? (
        <div className={styles.toolbar}>
          <div className={styles.columnsMenu}>
            <button type="button" className={styles.actionLabel} onClick={() => setColumnsOpen((open) => !open)}>
              Columns
            </button>
            {columnsOpen ? (
              <div className={styles.columnsPanel}>
                {hideable.map((column) => (
                  <Checkbox
                    key={column.id}
                    label={column.header}
                    checked={!hidden.includes(column.id)}
                    onChange={() => toggleColumn(column.id)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <section className={styles.scroll} data-tilt="" data-tilt-max="2" aria-label={ariaLabel}>
        <div className={styles.sheet}>
        <table className={styles.table}>
          <thead>
            <tr>
              {selectable ? (
                <th className={styles.colHandle}>
                  <Checkbox
                    ariaLabel="Select all rows on this page"
                    checked={rows.length > 0 && rows.every((row) => selected.has(getRowKey(row)))}
                    onChange={toggleAll}
                  />
                </th>
              ) : null}
              {visible.map((column) => (
                <th
                  key={column.id}
                  className={cn(column.hideOnMobile && styles.desktopOnly, column.align === "end" && styles.alignEnd, column.className)}
                  data-search={query.col === column.id || undefined}
                >
                  <ColumnHead column={column} query={query} pathname={pathname} current={current} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="adminStagger">
            {rows.length === 0 ? (
              <tr>
                <td className={styles.empty} colSpan={visible.length + (selectable ? 1 : 0)}>
                  {noResultsMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const id = getRowKey(row);
                return (
                  <tr key={id} data-spot="" className={cn("adminRise", getRowClassName?.(row))}>
                    {selectable ? (
                      <td className={styles.colHandle}>
                        <Checkbox
                          ariaLabel={`Select row ${id}`}
                          checked={selected.has(id)}
                          onChange={(checked) => toggleRow(id, checked)}
                        />
                      </td>
                    ) : null}
                    {visible.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          column.hideOnMobile && styles.desktopOnly,
                          column.align === "end" && styles.alignEnd,
                          column.className,
                        )}
                      >
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </section>
      <div className={styles.pager}>
        <span>
          {total === 0 ? "0" : `${(query.page - 1) * query.pageSize + 1}–${Math.min(total, query.page * query.pageSize)}`} of{" "}
          {total}
        </span>
        <span>
          {query.page > 1 ? (
            <Link href={listHref(pathname, current, { page: String(query.page - 1) })}>Previous</Link>
          ) : (
            <span data-disabled="">Previous</span>
          )}
          {" · "}
          {query.page < pageCount ? (
            <Link href={listHref(pathname, current, { page: String(query.page + 1) })}>Next</Link>
          ) : (
            <span data-disabled="">Next</span>
          )}
        </span>
      </div>
    </div>
  );
}

function ColumnHead<T>({
  column,
  query,
  pathname,
  current,
}: {
  column: DataTableColumn<T>;
  query: ListQuery;
  pathname: string;
  current: URLSearchParams;
}) {
  const router = useRouter();
  const active = query.col === column.id;
  const [editing, setEditing] = useState(active);
  const [draft, setDraft] = useState(active ? query.q : "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditing(active);
    setDraft(active ? query.q : "");
  }, [active, query.q]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    const handle = window.setTimeout(() => {
      const next = draft.trim();
      if (next === (active ? query.q : "")) return;
      apply(next);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [draft, editing, active, query.q]);

  function apply(value: string) {
    const next = value.trim();
    if (!next && !active) {
      setEditing(false);
      return;
    }
    router.replace(
      listHref(pathname, current, {
        q: next || null,
        col: next ? column.id : null,
        page: "1",
      }),
    );
    if (!next) setEditing(false);
  }

  const sortHref = listHref(pathname, current, {
    sort: column.id,
    dir: query.sort === column.id && query.dir === "asc" ? "desc" : "asc",
    page: "1",
  });
  const sortMark = column.sortable ? (
    <Link
      className={styles.sortMark}
      data-active={query.sort === column.id || undefined}
      href={sortHref}
      aria-label={`Sort by ${column.header}`}
    >
      {query.sort === column.id && query.dir === "asc" ? "↑" : "↓"}
    </Link>
  ) : null;

  if (!column.search) {
    if (!sortMark) return <span className={styles.headLabel}>{column.header}</span>;
    return (
      <span className={styles.columnHead}>
        {sortMark}
        <Link className={styles.headButton} data-active={query.sort === column.id || undefined} href={sortHref}>
          {column.header}
        </Link>
      </span>
    );
  }

  return (
    <div className={styles.columnHead}>
      {sortMark}
      {editing ? (
        <span className={styles.headEdit}>
          <input
            ref={inputRef}
            className={styles.headInput}
            aria-label={`Search ${column.header}`}
            placeholder={column.header}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => apply(draft)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                event.preventDefault();
                setDraft("");
                if (active) apply("");
                else setEditing(false);
              }
            }}
          />
          {draft ? (
            <button
              type="button"
              className={styles.headClear}
              aria-label={`Clear ${column.header}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setDraft("");
                apply("");
              }}
            >
              ×
            </button>
          ) : null}
        </span>
      ) : (
        <button
          type="button"
          className={styles.headButton}
          onClick={() => {
            setDraft(active ? query.q : "");
            setEditing(true);
          }}
        >
          {column.header}
        </button>
      )}
    </div>
  );
}
