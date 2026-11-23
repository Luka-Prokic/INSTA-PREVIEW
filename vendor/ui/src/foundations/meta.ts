export const cakaThemes = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
] as const;

export const cakaCollectionId = "caka-ui";

export type CakaThemeId = (typeof cakaThemes)[number]["id"];
