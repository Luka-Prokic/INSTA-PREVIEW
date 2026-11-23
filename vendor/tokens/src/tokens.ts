/**
 * Typed references to the CSS custom properties defined in `css/tokens.css`.
 *
 * These return `var(--token)` strings so component logic and inline dynamic
 * styles can reference tokens without hardcoding variable names. The runtime
 * values still come from CSS (and therefore respond to theme switching).
 *
 * Example:
 *   import { color, space } from "@luka-prokic/tokens";
 *   <div style={{ gap: space[4], background: color.surface }} />
 */

const ref = <T extends string>(name: T): `var(--${T})` => `var(--${name})`;

export const color = {
  bg: ref("color-bg"),
  surface: ref("color-surface"),
  surfaceRaised: ref("color-surface-raised"),
  surfaceSunken: ref("color-surface-sunken"),
  surfaceGlass: ref("color-surface-glass"),
  overlay: ref("color-overlay"),
  fg: ref("color-fg"),
  fgMuted: ref("color-fg-muted"),
  fgSubtle: ref("color-fg-subtle"),
  fgOnAccent: ref("color-fg-on-accent"),
  border: ref("color-border"),
  borderStrong: ref("color-border-strong"),
  hairline: ref("color-hairline"),
  hover: ref("color-hover"),
  active: ref("color-active"),
  focusRing: ref("color-focus-ring"),
  primary: ref("color-primary"),
  primaryHover: ref("color-primary-hover"),
  primaryActive: ref("color-primary-active"),
  onPrimary: ref("color-on-primary"),
  secondary: ref("color-secondary"),
  secondaryHover: ref("color-secondary-hover"),
  secondaryActive: ref("color-secondary-active"),
  onSecondary: ref("color-on-secondary"),
  success: ref("color-success"),
  successSurface: ref("color-success-surface"),
  successBorder: ref("color-success-border"),
  warning: ref("color-warning"),
  warningSurface: ref("color-warning-surface"),
  warningBorder: ref("color-warning-border"),
  danger: ref("color-danger"),
  dangerSurface: ref("color-danger-surface"),
  dangerBorder: ref("color-danger-border"),
  info: ref("color-info"),
  infoSurface: ref("color-info-surface"),
  infoBorder: ref("color-info-border"),
} as const;

export const space = {
  0: ref("space-0"),
  px: ref("space-px"),
  1: ref("space-1"),
  2: ref("space-2"),
  3: ref("space-3"),
  4: ref("space-4"),
  5: ref("space-5"),
  6: ref("space-6"),
  7: ref("space-7"),
  8: ref("space-8"),
  10: ref("space-10"),
  12: ref("space-12"),
  16: ref("space-16"),
  20: ref("space-20"),
  24: ref("space-24"),
  32: ref("space-32"),
} as const;

export const fontSize = {
  xs: ref("font-size-xs"),
  sm: ref("font-size-sm"),
  md: ref("font-size-md"),
  lg: ref("font-size-lg"),
  xl: ref("font-size-xl"),
  "2xl": ref("font-size-2xl"),
  "3xl": ref("font-size-3xl"),
  "4xl": ref("font-size-4xl"),
  "5xl": ref("font-size-5xl"),
} as const;

export const fontWeight = {
  regular: ref("font-weight-regular"),
  medium: ref("font-weight-medium"),
  semibold: ref("font-weight-semibold"),
  bold: ref("font-weight-bold"),
} as const;

export const radius = {
  none: ref("radius-none"),
  sm: ref("radius-sm"),
  md: ref("radius-md"),
  lg: ref("radius-lg"),
  xl: ref("radius-xl"),
  "2xl": ref("radius-2xl"),
  full: ref("radius-full"),
  control: ref("radius-control"),
  surface: ref("radius-surface"),
  sheet: ref("radius-sheet"),
  banner: ref("radius-banner"),
  media: ref("radius-media"),
} as const;

export const shadow = {
  xs: ref("shadow-xs"),
  sm: ref("shadow-sm"),
  md: ref("shadow-md"),
  lg: ref("shadow-lg"),
  xl: ref("shadow-xl"),
  glass: ref("shadow-glass"),
  accentBleed: ref("shadow-accent-bleed"),
} as const;

export const fontFamily = {
  sans: ref("font-sans"),
  display: ref("font-display"),
  serif: ref("font-serif"),
  mono: ref("font-mono"),
} as const;

export const blur = {
  glass: ref("blur-glass"),
} as const;

export const zIndex = {
  base: ref("z-base"),
  docked: ref("z-docked"),
  dropdown: ref("z-dropdown"),
  sticky: ref("z-sticky"),
  header: ref("z-header"),
  overlay: ref("z-overlay"),
  modal: ref("z-modal"),
  popover: ref("z-popover"),
  toast: ref("z-toast"),
  tooltip: ref("z-tooltip"),
} as const;

export const duration = {
  instant: ref("duration-instant"),
  fast: ref("duration-fast"),
  base: ref("duration-base"),
  slow: ref("duration-slow"),
  slower: ref("duration-slower"),
} as const;

export const easing = {
  standard: ref("easing-standard"),
  out: ref("easing-out"),
  in: ref("easing-in"),
  inOut: ref("easing-in-out"),
  emphasized: ref("easing-emphasized"),
} as const;

export const tokens = {
  color,
  space,
  fontSize,
  fontWeight,
  fontFamily,
  radius,
  shadow,
  blur,
  zIndex,
  duration,
  easing,
} as const;

export type Tokens = typeof tokens;
export type SpaceToken = keyof typeof space;
export type ColorToken = keyof typeof color;
export type RadiusToken = keyof typeof radius;
export type ShadowToken = keyof typeof shadow;
export type FontSizeToken = keyof typeof fontSize;
