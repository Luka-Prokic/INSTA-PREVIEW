/** Instagram-style compact counts: 999 → "999", 1200 → "1,200", 12500 → "12.5K". */
export function formatCount(n: number, approx = false): string {
  const abs = Math.abs(n);
  let text: string;
  if (abs < 10_000) {
    text = abs.toLocaleString("en-US");
  } else if (abs < 1_000_000) {
    const k = abs / 1_000;
    text = `${k >= 100 ? Math.round(k) : Math.round(k * 10) / 10}K`;
  } else {
    const m = abs / 1_000_000;
    text = `${m >= 100 ? Math.round(m) : Math.round(m * 10) / 10}M`;
  }
  return approx ? `~${text}` : text;
}
