import { t } from '@/i18n';
import { sequenceCellText } from './marking';
import type { SequenceAnswer, SequenceInstance } from './types';

export interface SequenceTableInputProps {
  readonly instance: SequenceInstance;
  readonly value: SequenceAnswer;
  readonly onChange: (next: SequenceAnswer) => void;
}

const inputClass =
  'min-h-touch w-full min-w-[4rem] rounded-md border border-navy-200 bg-white px-2 text-navy-900';

/** The table the student fills: one select per phase and an angle box per step. */
export function SequenceTableInput({ instance, value, onChange }: SequenceTableInputProps) {
  const options = instance.cellKind === 'on-off' ? [0, 1] : [1, 0, -1];

  function setCell(r: number, j: number, v: number) {
    onChange({
      ...value,
      cells: value.cells.map((row, i) => (i === r ? row.map((c, k) => (k === j ? v : c)) : row)),
    });
  }

  function setAngle(r: number, text: string) {
    onChange({ ...value, angles: value.angles.map((a, i) => (i === r ? text : a)) });
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-sm">
        <caption className="mb-1 text-left text-navy-700">{t('quiz.seq.caption')}</caption>
        <thead>
          <tr className="text-left text-navy-800">
            <th scope="col" className="pr-3">
              {t('quiz.seq.step')}
            </th>
            {instance.phaseLabels.map((ph) => (
              <th key={ph} scope="col" className="px-1">
                {ph}
              </th>
            ))}
            <th scope="col" className="px-1">
              {t('quiz.seq.angle')}
            </th>
          </tr>
        </thead>
        <tbody>
          {instance.answer.map((row, r) => (
            <tr key={r}>
              <th scope="row" className="pr-3 text-left font-medium text-navy-800">
                {r + 1}
              </th>
              {row.map((_, j) => (
                <td key={j} className="px-1 py-0.5">
                  <select
                    aria-label={t('quiz.seq.cell', {
                      row: r + 1,
                      phase: instance.phaseLabels[j] ?? '',
                    })}
                    value={value.cells[r]?.[j] ?? 0}
                    onChange={(e) => setCell(r, j, Number(e.target.value))}
                    className={inputClass}
                  >
                    {options.map((o) => (
                      <option key={o} value={o}>
                        {sequenceCellText(o, instance.cellKind)}
                      </option>
                    ))}
                  </select>
                </td>
              ))}
              <td className="px-1 py-0.5">
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label={t('quiz.seq.angleLabel', { row: r + 1 })}
                  value={value.angles[r] ?? ''}
                  onChange={(e) => setAngle(r, e.target.value)}
                  className={`${inputClass} w-24`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
