/**
 * Responsive breakpoints (px). Source of truth for JS-driven media queries
 * and the Playground viewport controls. CSS cannot read custom properties
 * inside `@media`, so breakpoints live here as typed constants.
 */
export const breakpoints = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/** `min-width` media query string for a breakpoint. */
export function up(breakpoint: Breakpoint): string {
  return `(min-width: ${breakpoints[breakpoint]}px)`;
}

/** `max-width` media query string (exclusive) for a breakpoint. */
export function down(breakpoint: Breakpoint): string {
  return `(max-width: ${breakpoints[breakpoint] - 0.02}px)`;
}
