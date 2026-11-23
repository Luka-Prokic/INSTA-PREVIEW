const USERNAME_RE = /^[a-z0-9._]{1,30}$/;

/** Accepts "@name", "name", or a profile URL; returns null when it cannot be a valid handle. */
export function normalizeUsername(input: string): string | null {
  let value = input.trim();
  const urlMatch = value.match(/instagram\.com\/([^/?#]+)/i);
  if (urlMatch?.[1]) value = urlMatch[1];
  value = value.replace(/^@/, "").toLowerCase();
  return USERNAME_RE.test(value) ? value : null;
}
