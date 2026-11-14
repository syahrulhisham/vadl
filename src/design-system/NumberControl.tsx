import { useId, useState, type ChangeEvent } from 'react';
import { validateNumber } from './validateNumber';

export interface NumberControlProps {
  readonly label: string;
  /** Current accepted value, in `unit`. */
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly unit: string;
  /** Called only with valid, in-range values (FR-05). */
  readonly onChange: (value: number) => void;
  /**
   * Engineering explanation shown when the typed value is out of range, e.g.
   * "Armature voltage above 250 V exceeds the motor rating."
   * Defaults to a plain range message.
   */
  readonly explainOutOfRange?: (attempted: number) => string;
  readonly disabled?: boolean;
}

/**
 * A labelled parameter control: a slider for quick adjustment and a number box
 * for exact entry (FR-05). Out-of-range input is rejected with a message and is
 * never passed to the model. Both inputs are keyboard operable (NFR-10) and at
 * least 44 px tall (NFR-03).
 */
export function NumberControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  explainOutOfRange,
  disabled = false,
}: NumberControlProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(value);
  const validation =
    draft === null ? null : validateNumber(draft, min, max, unit, explainOutOfRange);
  const invalid = validation !== null && !validation.ok;

  function handleText(e: ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    const result = validateNumber(text, min, max, unit, explainOutOfRange);
    if (result.ok) {
      setDraft(null);
      onChange(result.value);
    } else {
      setDraft(text);
    }
  }

  function handleSlider(e: ChangeEvent<HTMLInputElement>) {
    setDraft(null);
    onChange(Number(e.target.value));
  }

  return (
    <div className="space-y-1">
      <label htmlFor={`${id}-number`} className="block text-sm font-medium text-navy-800">
        {label} <span className="font-normal text-navy-600">({unit})</span>
      </label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          aria-label={`${label} slider`}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSlider}
          disabled={disabled}
          className="min-h-touch flex-1 accent-navy-700"
        />
        <input
          id={`${id}-number`}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={shown}
          onChange={handleText}
          onBlur={() => setDraft(null)}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={invalid ? messageId : undefined}
          className={`min-h-touch w-28 rounded-md border px-2 text-right tabular-nums text-navy-900 ${
            invalid ? 'border-status-danger' : 'border-navy-200'
          }`}
        />
      </div>
      {invalid && validation && !validation.ok ? (
        <p
          id={messageId}
          role="alert"
          className="rounded bg-status-dangerBg px-2 py-1 text-sm text-status-danger"
        >
          {validation.message}
        </p>
      ) : null}
    </div>
  );
}
