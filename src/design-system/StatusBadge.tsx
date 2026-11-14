export type StatusTone = 'neutral' | 'info' | 'warning';

const TONES: Record<StatusTone, string> = {
  neutral: 'bg-navy-50 text-navy-700 border-navy-100',
  info: 'bg-lightblue-100 text-navy-900 border-lightblue-200',
  warning: 'bg-status-warningBg text-status-warning border-status-warning/30',
};

export interface StatusBadgeProps {
  readonly tone?: StatusTone;
  readonly children: string;
}

/** A small text badge. The meaning is always in the text; colour only supports it (NFR-10). */
export function StatusBadge({ tone = 'neutral', children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
