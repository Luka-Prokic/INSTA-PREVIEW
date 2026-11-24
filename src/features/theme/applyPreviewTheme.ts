import { applyAdminTheme, type AdminTheme } from "@/lib/caka-admin";

/** Persist theme and keep `data-theme="light"` explicit (avoid OS dark token bleed). */
export function applyPreviewTheme(theme: AdminTheme) {
  applyAdminTheme(theme);
  if (typeof document === "undefined") return;
  if (theme === "light") document.documentElement.setAttribute("data-theme", "light");

  const paper = getComputedStyle(document.documentElement).getPropertyValue("--color-paper").trim();
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", paper || (theme === "dark" ? "#0e0e0f" : "#f0eeea"));
}
