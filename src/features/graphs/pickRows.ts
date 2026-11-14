/** Evenly pick at most `n` rows (n ≥ 2), always keeping the first and last. */
export function pickRows<T>(rows: readonly T[], n: number): T[] {
  if (n < 2) throw new RangeError('n must be at least 2');
  if (rows.length <= n) return [...rows];
  const out: T[] = [];
  for (let i = 0; i < n; i += 1) out.push(rows[Math.round((i * (rows.length - 1)) / (n - 1))] as T);
  return out;
}
