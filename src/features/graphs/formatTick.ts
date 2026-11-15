/** Axis tick label: at most 4 significant figures, no floating-point noise. */
export function formatTick(value: number): string {
  if (!Number.isFinite(value)) return '';
  if (value === 0) return '0';
  return String(Number(value.toPrecision(4)));
}
