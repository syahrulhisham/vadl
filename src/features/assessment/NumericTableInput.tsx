import { t } from '@/i18n';
import type { TableInstance } from './types';

/** One answer box per row of a numeric table question. */
export function NumericTableInput({
  instance,
  value,
  onChange,
}: {
  readonly instance: TableInstance;
  readonly value: readonly string[];
  readonly onChange: (next: string[]) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="text-sm">
        <caption className="mb-1 text-left text-navy-700">{t('quiz.table.caption')}</caption>
        <thead>
          <tr className="text-left text-navy-800">
            <th scope="col" className="pr-4">
              {instance.keyHeader}
            </th>
            <th scope="col">{instance.valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {instance.rows.map((row, i) => (
            <tr key={row.key}>
              <th scope="row" className="pr-4 text-left font-medium text-navy-800">
                {row.key}
              </th>
              <td className="py-0.5">
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label={t('quiz.table.cell', { key: row.key, header: instance.valueHeader })}
                  value={value[i] ?? ''}
                  onChange={(e) => onChange(value.map((v, k) => (k === i ? e.target.value : v)))}
                  className="min-h-touch w-28 rounded-md border border-navy-200 bg-white px-2 text-navy-900"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
