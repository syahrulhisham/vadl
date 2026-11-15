import { useEffect, useState } from 'react';
import { Button, PageHeader, Panel } from '@/design-system';
import {
  LEVELS,
  percent,
  scoreSummary,
  sumTallies,
  toCsv,
  type Attempt,
  type ScoreSummary,
  type Tally,
} from '@/features/assessment';
import { moduleProgress, type ProgressRecord } from '@/features/progress';
import type { ExperimentSession } from '@/features/reports';
import { t } from '@/i18n';
import { moduleTitle } from '@/modules/courseRefs';
import { builtLab, type BuiltLab } from '@/modules/labs';
import { MODULES } from '@/modules/registry';
import type { ModuleSummary } from '@/modules/types';
import { formatSignificant } from '@/sim-core';
import { attemptsKey, PROGRESS_KEY, sessionsKey, useRepository, type Repository } from '@/storage';
import { downloadText } from '@/hooks';
import { useDocumentTitle } from '../useDocumentTitle';

interface ModuleData {
  readonly module: ModuleSummary;
  readonly lab: BuiltLab;
  readonly label: string;
  readonly rows: number;
  readonly activities: number;
  readonly reports: number;
  readonly lastOpened: string | null;
  readonly score: ScoreSummary;
}

const BUILT = MODULES.flatMap((m) => {
  const lab = builtLab(m.id);
  return lab ? [{ module: m, lab }] : [];
});

const pct = (x: Tally) => {
  const p = percent(x);
  return Number.isNaN(p) ? '—' : `${formatSignificant(p, 3)} %`;
};
const tallyText = (x: Tally) => `${x.correct} / ${x.attempts} (${pct(x)})`;

/** Read every built laboratory's stored data. */
async function fetchAll(repository: Repository): Promise<ModuleData[]> {
  const progress = (await repository.get<ProgressRecord>(PROGRESS_KEY)) ?? {};
  return Promise.all(
    BUILT.map(async ({ module, lab }) => {
      const sessions = (await repository.get<ExperimentSession[]>(sessionsKey(module.id))) ?? [];
      const attempts = (await repository.get<Attempt[]>(attemptsKey(module.id))) ?? [];
      const p = moduleProgress(progress, module.id);
      return {
        module,
        lab,
        label: `${module.number}. ${moduleTitle(module)}`,
        rows: sessions.reduce((n, s) => n + s.rows.length, 0),
        activities: p.activitiesCompleted.length,
        reports: p.reportsGenerated,
        lastOpened: p.lastOpened,
        score: scoreSummary(attempts, lab.questions, lab.outcomes),
      };
    }),
  );
}

/**
 * Student progress across all laboratories (FR-12), read from this browser's
 * storage only: activities, recorded rows, self-study scores by level and by
 * course learning outcome, answers awaiting the lecturer, reports printed.
 */
export default function ProgressPage() {
  useDocumentTitle(t('progress.title'));
  const { repository } = useRepository();
  const [data, setData] = useState<readonly ModuleData[] | null>(null);
  const [message, setMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchAll(repository).then((loaded) => {
      if (!cancelled) setData(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [repository, reload]);

  const total = data ? sumTallies(data.map((d) => d.score.auto)) : null;
  const byLevel = data
    ? LEVELS.map((l) => ({ level: l, tally: sumTallies(data.map((d) => d.score.byLevel[l])) }))
    : [];
  const byLo = data
    ? (['LO1', 'LO2'] as const).map((lo) => ({
        lo,
        tally: sumTallies(data.map((d) => d.score.byCourseLo[lo])),
      }))
    : [];

  function downloadSummary() {
    if (!data) return;
    const csv = toCsv(
      [
        t('progress.module'),
        t('progress.activities'),
        t('progress.activitiesTotal'),
        t('progress.rows'),
        t('progress.correct'),
        t('progress.answered'),
        t('progress.pending'),
        t('progress.reports'),
        t('progress.lastOpened'),
      ],
      data.map((d) => [
        d.label,
        d.activities,
        d.lab.activityCount,
        d.rows,
        d.score.auto.correct,
        d.score.auto.attempts,
        d.score.lecturer.length,
        d.reports,
        d.lastOpened ?? '',
      ]),
    );
    downloadText('vadl-progress.csv', csv, 'text/csv');
  }

  async function backup() {
    const all = await repository.exportAll();
    downloadText('vadl-backup.json', JSON.stringify(all, null, 2), 'application/json');
  }

  async function restore(file: File) {
    try {
      await repository.importAll(JSON.parse(await file.text()) as Record<string, unknown>);
      setMessage(t('progress.restored'));
      setReload((n) => n + 1);
    } catch {
      setMessage(t('progress.restoreFailed'));
    }
  }

  async function deleteAll() {
    await repository.clearAll();
    setConfirmDelete(false);
    setMessage(t('progress.deleted'));
    setReload((n) => n + 1);
  }

  return (
    <>
      <PageHeader title={t('progress.title')} intro={t('progress.intro')} icon="progress" />
      <div className="space-y-4">
        <Panel title={t('progress.title')}>
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[48rem] border-collapse text-left text-sm"
              data-testid="progress-table"
            >
              <thead>
                <tr className="border-b border-navy-200 text-navy-800">
                  {[
                    t('progress.module'),
                    t('progress.activities'),
                    t('progress.rows'),
                    t('progress.attempts'),
                    t('progress.pending'),
                    t('progress.reports'),
                    t('progress.lastOpened'),
                  ].map((h) => (
                    <th key={h} scope="col" className="py-2 pr-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((d) => (
                  <tr
                    key={d.module.id}
                    className="border-b border-navy-100"
                    data-module-id={d.module.id}
                  >
                    <th scope="row" className="py-2 pr-3 font-medium text-navy-900">
                      {d.label}
                    </th>
                    <td className="py-2 pr-3">
                      {d.activities} / {d.lab.activityCount}
                    </td>
                    <td className="py-2 pr-3">{d.rows}</td>
                    <td className="py-2 pr-3">{tallyText(d.score.auto)}</td>
                    <td className="py-2 pr-3">{d.score.lecturer.length}</td>
                    <td className="py-2 pr-3">{d.reports}</td>
                    <td className="py-2">
                      {d.lastOpened ? new Date(d.lastOpened).toLocaleString() : t('progress.never')}
                    </td>
                  </tr>
                ))}
              </tbody>
              {total ? (
                <tfoot>
                  <tr className="font-semibold text-navy-900">
                    <th scope="row" className="py-2 pr-3">
                      {t('progress.total')}
                    </th>
                    <td className="py-2 pr-3">
                      {(data ?? []).reduce((n, d) => n + d.activities, 0)} /{' '}
                      {(data ?? []).reduce((n, d) => n + d.lab.activityCount, 0)}
                    </td>
                    <td className="py-2 pr-3">{(data ?? []).reduce((n, d) => n + d.rows, 0)}</td>
                    <td className="py-2 pr-3" data-testid="progress-total-score">
                      {tallyText(total)}
                    </td>
                    <td className="py-2 pr-3">
                      {(data ?? []).reduce((n, d) => n + d.score.lecturer.length, 0)}
                    </td>
                    <td className="py-2 pr-3">{(data ?? []).reduce((n, d) => n + d.reports, 0)}</td>
                    <td />
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title={t('progress.byLevel')}>
            <table className="w-full text-left text-sm" data-testid="progress-levels">
              <tbody>
                {byLevel.map(({ level, tally }) => (
                  <tr key={level} className="border-b border-navy-100">
                    <th scope="row" className="py-2 pr-3 font-medium">
                      {t(`level.${level}`)}
                    </th>
                    <td className="py-2">{tallyText(tally)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title={t('progress.byLo')}>
            <table className="w-full text-left text-sm" data-testid="progress-los">
              <tbody>
                {byLo.map(({ lo, tally }) => (
                  <tr key={lo} className="border-b border-navy-100">
                    <th scope="row" className="py-2 pr-3 font-medium">
                      {t(`progress.${lo}`)}
                    </th>
                    <td className="py-2">{tallyText(tally)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-navy-600">{t('progress.loNote')}</p>
          </Panel>
        </div>

        <Panel title={t('progress.dataTitle')}>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={downloadSummary} disabled={!data}>
                {t('progress.downloadSummary')}
              </Button>
              <Button variant="secondary" onClick={() => void backup()}>
                {t('progress.backup')}
              </Button>
              <label className="inline-flex min-h-touch cursor-pointer items-center rounded-md border border-navy-200 bg-lightblue-50 px-4 font-semibold text-navy-900">
                {t('progress.restore')}
                <input
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void restore(f);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <p className="text-sm text-navy-700">{t('progress.backupHint')}</p>
            {confirmDelete ? (
              <div
                role="alertdialog"
                aria-label={t('progress.deleteTitle')}
                className="space-y-2 rounded border border-status-danger bg-status-dangerBg p-3"
              >
                <p className="text-sm text-status-danger">{t('progress.deleteWarning')}</p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void deleteAll()}>{t('progress.deleteConfirm')}</Button>
                  <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
                    {t('progress.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
                {t('progress.delete')}
              </Button>
            )}
            {message ? (
              <p role="status" className="text-sm font-medium text-navy-900">
                {message}
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel title={t('nav.assessment')} tone="info">
          <p>{t('assessment.purpose')}</p>
          <p className="mt-2">{t('app.privacy')}</p>
        </Panel>
      </div>
    </>
  );
}
