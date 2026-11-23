export type ClassValue = string | number | null | false | undefined;

/**
 * Join truthy class values into a single className string.
 * Returns `undefined` when empty so React omits the attribute entirely.
 */
export function cn(...values: ClassValue[]): string | undefined {
  const joined = values.filter(Boolean).join(" ");
  return joined.length > 0 ? joined : undefined;
}
