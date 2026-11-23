export type ListQuery = {
  q: string;
  col: string;
  sort: string;
  dir: "asc" | "desc";
  page: number;
  pageSize: number;
};

export function parseListQuery(
  params: Record<string, string | string[] | undefined>,
  defaults: { pageSize?: number; sort?: string; dir?: "asc" | "desc" } = {},
): ListQuery {
  const one = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  };
  const page = Number(one("page"));
  const dir = one("dir") === "desc" ? "desc" : one("dir") === "asc" ? "asc" : (defaults.dir ?? "asc");
  return {
    q: one("q").trim(),
    col: one("col").trim(),
    sort: one("sort").trim() || defaults.sort || "",
    dir,
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    pageSize: defaults.pageSize ?? 20,
  };
}

export function listHref(pathname: string, current: URLSearchParams, patch: Record<string, string | null>): string {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(patch)) {
    if (value == null || value === "") next.delete(key);
    else next.set(key, value);
  }
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}
