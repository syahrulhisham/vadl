import { formatSignificant } from '@/sim-core';

export interface MeasurementDisplayProps {
  /** Quantity name, e.g. "Armature current". */
  readonly label: string;
  /** Course symbol, e.g. "Ia". Optional. */
  readonly symbol?: string;
  /**
   * Value already converted to `unit` by sim-core/units. `null` means no value
   * has been produced yet; it is shown as "—", never as a placeholder number.
   */
  readonly value: number | null;
  /** Display unit, e.g. "A", "rpm", "bar". */
  readonly unit: string;
  readonly significantFigures?: number;
}

/**
 * A single measurement readout (FR-06). The value is at least 24 px (text-2xl)
 * for projector legibility (NFR-04) and uses tabular figures so digits do not
 * jump while the value changes.
 */
export function MeasurementDisplay({
  label,
  symbol,
  value,
  unit,
  significantFigures = 4,
}: MeasurementDisplayProps) {
  const text = value === null ? '—' : formatSignificant(value, significantFigures);
  const hasValue = value !== null && Number.isFinite(value);
  return (
    <div
      className="rounded-md border border-navy-100 bg-white px-3 py-2"
      role="group"
      aria-label={label}
    >
      <p className="text-sm text-navy-600">
        {label}
        {symbol ? <span className="ml-1 font-mono text-navy-500">({symbol})</span> : null}
      </p>
      <p className="mt-1 flex flex-wrap items-baseline gap-1.5">
        <span
          data-testid="measurement-value"
          className="text-2xl font-semibold tabular-nums text-navy-900"
          aria-label={hasValue ? `${text} ${unit}` : 'no value yet'}
        >
          {text}
        </span>
        <span className="text-base text-navy-600">{unit}</span>
      </p>
    </div>
  );
}
