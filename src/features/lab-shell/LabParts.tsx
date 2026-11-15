/**
 * Building blocks shared by every laboratory, so the seven regions look and
 * behave the same across modules (master instruction §6).
 */
import type { ReactNode } from 'react';
import { Button, StatusBadge } from '@/design-system';
import { ResultsTable, type ResultsColumn } from '@/features/recording';
import type { RecordedRow } from '@/features/reports';
import { t } from '@/i18n';
import type { ActivityContent, LabOutcome } from './labContent';
import { selectClass } from './labConstants';
import type { RunStatus } from '@/sim-core';

/** A labelled native select with touch-sized height. */
export function SelectField<V extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  readonly label: string;
  readonly value: V;
  readonly options: readonly { readonly value: V; readonly label: string }[];
  readonly onChange: (value: V) => void;
  readonly disabled?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-navy-800">
      {label}
      <select
        className={selectClass}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as V)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export interface RunControlsProps {
  readonly status: RunStatus;
  readonly lagging: boolean;
  readonly onStart: () => void;
  readonly onPause: () => void;
  readonly onStop: () => void;
  readonly onReset: () => void;
  readonly playback: number;
  readonly playbackOptions: readonly { readonly value: number; readonly label: string }[];
  readonly onPlayback: (value: number) => void;
}

/** Start, pause/resume, stop and reset (FR-04), status line and playback speed. */
export function RunControls(props: RunControlsProps) {
  const { status } = props;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status === 'running' ? (
          <Button onClick={props.onPause}>{t('run.pause')}</Button>
        ) : (
          <Button onClick={props.onStart} disabled={status === 'stopped' || status === 'finished'}>
            {status === 'paused' ? t('run.resume') : t('run.start')}
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={props.onStop}
          disabled={status !== 'running' && status !== 'paused'}
        >
          {t('run.stop')}
        </Button>
        <Button variant="secondary" onClick={props.onReset} disabled={status === 'idle'}>
          {t('run.reset')}
        </Button>
      </div>
      <p role="status" className="text-sm text-navy-700" data-testid="run-status">
        {t(`run.status.${status}`)}
      </p>
      {props.lagging ? (
        <p className="rounded bg-status-warningBg px-2 py-1 text-sm text-status-warning">
          {t('run.lagging')}
        </p>
      ) : null}
      <label className="block max-w-xs text-sm font-medium text-navy-800">
        {t('run.playback')}
        <select
          className={selectClass}
          value={props.playback}
          onChange={(e) => props.onPlayback(Number(e.target.value))}
        >
          {props.playbackOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/** Record / clear buttons and the results table (FR-08). */
export function RecordPanel({
  rows,
  columns,
  onRecord,
  onClear,
}: {
  readonly rows: readonly RecordedRow[];
  readonly columns: readonly ResultsColumn[];
  readonly onRecord: () => void;
  readonly onClear: () => void;
}) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onRecord}>{t('lab.record')}</Button>
        <Button variant="ghost" onClick={onClear} disabled={rows.length === 0}>
          {t('lab.clear')}
        </Button>
      </div>
      <ResultsTable rows={rows} columns={columns} caption={t('lab.tableCaption')} />
    </>
  );
}

/** Guided and independent activities with a completed checkbox each. */
export function ActivitiesList({
  activities,
  done,
  onToggle,
}: {
  readonly activities: readonly ActivityContent[];
  readonly done: readonly string[];
  readonly onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-3 text-sm">
      {activities.map((a) => (
        <details
          key={a.id}
          className="rounded-md border border-navy-100 p-3"
          data-activity-id={a.id}
        >
          <summary className="flex min-h-touch cursor-pointer flex-wrap items-center gap-2 py-1">
            <span className="font-semibold text-navy-800">{a.title}</span>
            <StatusBadge>{t(`level.${a.level}`)}</StatusBadge>
            <StatusBadge tone="info">
              {a.guided ? t('lab.guided') : t('lab.independent')}
            </StatusBadge>
            {done.includes(a.id) ? <StatusBadge tone="info">✓</StatusBadge> : null}
          </summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            {a.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <label className="mt-2 flex min-h-touch items-center gap-2">
            <input
              type="checkbox"
              className="h-5 w-5 accent-navy-700"
              checked={done.includes(a.id)}
              onChange={() => onToggle(a.id)}
            />
            {t('lab.markDone')}
          </label>
        </details>
      ))}
    </div>
  );
}

/** A theory block: a heading and a list, optionally monospaced (equations) and collapsible. */
export function TheoryBlock({
  title,
  items,
  mono = false,
  collapsible = false,
  children,
}: {
  readonly title: string;
  readonly items?: readonly string[];
  readonly mono?: boolean;
  readonly collapsible?: boolean;
  readonly children?: ReactNode;
}) {
  const body = (
    <>
      {items ? (
        <ul
          className={
            mono ? 'mt-1 space-y-1 font-mono text-navy-900' : 'mt-1 list-disc space-y-1 pl-5'
          }
        >
          {items.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
      {children}
    </>
  );
  if (collapsible) {
    return (
      <details className="rounded-md border border-navy-100 px-3">
        <summary className="min-h-touch cursor-pointer py-2 font-semibold text-navy-800">
          {title}
        </summary>
        {body}
        <div className="pb-2" />
      </details>
    );
  }
  return (
    <section>
      <h3 className="font-semibold text-navy-800">{title}</h3>
      {body}
    </section>
  );
}

/** Learning outcomes with their course LO tag. */
export function OutcomesList({ outcomes }: { readonly outcomes: readonly LabOutcome[] }) {
  return (
    <TheoryBlock title={t('lab.outcomesTitle')} collapsible>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {outcomes.map((o) => (
          <li key={o.id}>
            {o.text} <span className="text-navy-600">({o.courseLo})</span>
          </li>
        ))}
      </ul>
    </TheoryBlock>
  );
}
