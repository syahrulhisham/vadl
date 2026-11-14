import { useId, type ReactNode } from 'react';

export interface PanelProps {
  readonly title: string;
  /** Heading level inside the page outline. Defaults to 2. */
  readonly level?: 2 | 3;
  /** Tone: plain white card, or the light-blue information tone. */
  readonly tone?: 'plain' | 'info';
  readonly className?: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  /** Optional test hook. */
  readonly testId?: string;
}

/**
 * A titled region. Rendered as a <section> labelled by its heading, so screen
 * readers list it as a landmark region and tests can find it by name.
 */
export function Panel({
  title,
  level = 2,
  tone = 'plain',
  className = '',
  actions,
  children,
  testId,
}: PanelProps) {
  const headingId = useId();
  const Heading = level === 2 ? 'h2' : 'h3';
  const toneClass =
    tone === 'info' ? 'border-lightblue-200 bg-lightblue-50' : 'border-navy-100 bg-white';
  return (
    <section
      aria-labelledby={headingId}
      data-testid={testId}
      className={`rounded-lg border p-4 shadow-sm ${toneClass} ${className}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Heading id={headingId} className="text-lg font-semibold text-navy-800">
          {title}
        </Heading>
        {actions}
      </div>
      <div className="text-navy-700">{children}</div>
    </section>
  );
}
