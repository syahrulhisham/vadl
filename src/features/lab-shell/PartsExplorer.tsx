import { Button } from '@/design-system';

export interface ExplorerPart {
  readonly id: string;
  readonly label: string;
  readonly text: string;
}

/**
 * Construction explorer (Milestone 11): a row of part buttons and the purpose
 * of the chosen part. The laboratory's diagram highlights the same part.
 */
export function PartsExplorer({
  title,
  hint,
  parts,
  selected,
  onSelect,
  testId = 'parts-explorer',
}: {
  readonly title: string;
  readonly hint: string;
  readonly parts: readonly ExplorerPart[];
  readonly selected: string | null;
  readonly onSelect: (id: string | null) => void;
  readonly testId?: string;
}) {
  const chosen = parts.find((x) => x.id === selected);
  return (
    <div role="group" aria-label={title} className="space-y-2" data-testid={testId}>
      <h3 className="text-base font-semibold text-navy-800">{title}</h3>
      <p className="text-sm text-navy-700">{hint}</p>
      <div className="flex flex-wrap gap-2">
        {parts.map((x) => (
          <Button
            key={x.id}
            variant={selected === x.id ? 'primary' : 'secondary'}
            aria-pressed={selected === x.id}
            onClick={() => onSelect(selected === x.id ? null : x.id)}
          >
            {x.label}
          </Button>
        ))}
      </div>
      <p className="text-sm text-navy-800" aria-live="polite" data-testid="part-description">
        {chosen ? `${chosen.label}: ${chosen.text}` : ''}
      </p>
    </div>
  );
}
