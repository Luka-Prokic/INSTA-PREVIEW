export const ADMIN_THEME_KEY = "caka.admin.theme";

export type AdminTheme = "light" | "dark";

export function readStoredAdminTheme(): AdminTheme {
  if (typeof window === "undefined") return "light";
  try {
    return window.localStorage.getItem(ADMIN_THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyAdminTheme(theme: AdminTheme): void {
  if (typeof document === "undefined") return;
  if (theme === "dark") document.documentElement.setAttribute("data-theme", "dark");
  else document.documentElement.removeAttribute("data-theme");
  try {
    window.localStorage.setItem(ADMIN_THEME_KEY, theme);
  } catch {
    /* storage unavailable */
  }
}

export const ADMIN_TABLE_DENSITY_KEY = "cms_admin_table_density";

export type AdminTableDensity = "compact" | "comfortable" | "spacious";

export const DEFAULT_ADMIN_TABLE_DENSITY: AdminTableDensity = "comfortable";

export const ADMIN_TABLE_ROW_SIZE_OPTIONS: {
  value: AdminTableDensity;
  shortLabel: "S" | "M" | "L";
  ariaLabel: string;
}[] = [
  { value: "compact", shortLabel: "S", ariaLabel: "Smaller interface" },
  { value: "comfortable", shortLabel: "M", ariaLabel: "Default interface" },
  { value: "spacious", shortLabel: "L", ariaLabel: "Larger interface" },
];

export function isAdminTableDensity(value: string | null | undefined): value is AdminTableDensity {
  return value === "compact" || value === "comfortable" || value === "spacious";
}

export function readStoredAdminTableDensity(): AdminTableDensity {
  if (typeof window === "undefined") return DEFAULT_ADMIN_TABLE_DENSITY;
  try {
    const stored = window.localStorage.getItem(ADMIN_TABLE_DENSITY_KEY);
    return isAdminTableDensity(stored) ? stored : DEFAULT_ADMIN_TABLE_DENSITY;
  } catch {
    return DEFAULT_ADMIN_TABLE_DENSITY;
  }
}

export function writeStoredAdminTableDensity(density: AdminTableDensity): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ADMIN_TABLE_DENSITY_KEY, density);
  } catch {
    /* storage unavailable */
  }
}

export function applyAdminTableDensityToDocument(density: AdminTableDensity): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.adminTableDensity = density;
}

export function adminTableDensityBootstrapScript(): string {
  return `(function(){try{var k=${JSON.stringify(ADMIN_TABLE_DENSITY_KEY)};var d=localStorage.getItem(k);if(d==="compact"||d==="spacious")document.documentElement.dataset.adminTableDensity=d;else document.documentElement.dataset.adminTableDensity="comfortable";}catch(e){}})();`;
}

export const ADMIN_TIME_FORMAT_KEY = "caka.admin.timeFormat";

export type AdminTimeFormat = "24h" | "12h";

export const DEFAULT_ADMIN_TIME_FORMAT: AdminTimeFormat = "24h";

export const ADMIN_TIME_FORMAT_OPTIONS: {
  value: AdminTimeFormat;
  shortLabel: string;
  ariaLabel: string;
}[] = [
  { value: "24h", shortLabel: "24h", ariaLabel: "24-hour clock" },
  { value: "12h", shortLabel: "12h", ariaLabel: "12-hour clock" },
];

export function isAdminTimeFormat(value: string | null | undefined): value is AdminTimeFormat {
  return value === "24h" || value === "12h";
}

export function readStoredAdminTimeFormat(): AdminTimeFormat {
  if (typeof window === "undefined") return DEFAULT_ADMIN_TIME_FORMAT;
  try {
    const stored = window.localStorage.getItem(ADMIN_TIME_FORMAT_KEY);
    return isAdminTimeFormat(stored) ? stored : DEFAULT_ADMIN_TIME_FORMAT;
  } catch {
    return DEFAULT_ADMIN_TIME_FORMAT;
  }
}

export function writeStoredAdminTimeFormat(format: AdminTimeFormat): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ADMIN_TIME_FORMAT_KEY, format);
  } catch {
    /* storage unavailable */
  }
}

export function formatAdminTime(
  value: Date | number,
  format: AdminTimeFormat,
  options?: { hourOnly?: boolean },
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  if (format === "24h") {
    const hours = String(date.getHours()).padStart(2, "0");
    if (options?.hourOnly) return `${hours}:00`;
    return `${hours}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: options?.hourOnly ? undefined : "2-digit",
    hour12: true,
  });
}
