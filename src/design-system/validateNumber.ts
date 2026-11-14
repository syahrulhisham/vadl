export type Validation =
  { readonly ok: true; readonly value: number } | { readonly ok: false; readonly message: string };

/**
 * Validate typed parameter input against its physical range (FR-05).
 * `explain` supplies an engineering explanation for out-of-range values.
 */
export function validateNumber(
  text: string,
  min: number,
  max: number,
  unit: string,
  explain?: (attempted: number) => string,
): Validation {
  const trimmed = text.trim();
  if (trimmed === '') return { ok: false, message: 'Enter a value.' };
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return { ok: false, message: 'Enter a number.' };
  if (n < min || n > max) {
    return {
      ok: false,
      message: explain ? explain(n) : `Enter a value from ${min} to ${max} ${unit}.`,
    };
  }
  return { ok: true, value: n };
}
