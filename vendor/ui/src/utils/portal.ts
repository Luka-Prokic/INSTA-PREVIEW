/** Resolve a portal mount that inherits collection CSS variables. */
export function getCollectionPortalRoot(): HTMLElement {
  if (typeof document === "undefined") {
    throw new Error("getCollectionPortalRoot requires a document");
  }
  return (
    document.querySelector<HTMLElement>(".collection-frame[data-collection]") ??
    document.querySelector<HTMLElement>("[data-collection]") ??
    document.body
  );
}
