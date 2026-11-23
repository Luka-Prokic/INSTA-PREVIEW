/** Theme identifiers understood by the token layer via `[data-theme]`. */
export const themes = ["light", "dark"] as const;

export type Theme = (typeof themes)[number];

/** Attribute name used to apply a theme on an ancestor element. */
export const THEME_ATTRIBUTE = "data-theme";
