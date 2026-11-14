import { PageHeader, Panel } from '@/design-system';
import type { Attempt } from '@/features/assessment/types';
import { moduleProgress, type ProgressRecord } from '@/features/progress';
import type { ExperimentSession } from '@/features/reports';
import { useStoredValue } from '@/hooks';
import { t } from '@/i18n';
import { moduleTitle } from '@/modules/courseRefs';
import { builtLab, type BuiltLab } from '@/modules/labs';
import { MODULES } from '@/modules/registry';
import type { ModuleSummary } from '@/modules/types';
import { attemptsKey, PROGRESS_KEY, sessionsKey } from '@/storage';
import { useDocumentTitle } from '../useDocumentTitle';

function ProgressRow({
  module,
  lab,
  progress,
}: {
  readonly module: ModuleSummary;
  readonly lab: BuiltLab;
  readonly progress: ProgressRecord;
}) {
  const sessions = useStoredValue<ExperimentSession[]>(sessionsKey(module.id), []);
  const attempts = useStoredValue<Attempt[]>(attemptsKey(module.id), []);
  const p = moduleProgress(progress, module.id);
  const rows = sessions.value.reduce((n, s) => n + s.rows.length, 0);
  const correct = attempts.value.filter((a) => a.correct).length;
  return (
    <tr className="border-b border-navy-100" data-module-id={module.id}>
      <th scope="row" className="py-2 pr-3 font-medium text-navy-900">
        {module.number}. {moduleTitle(module)}
      </th>
      <td className="py-2 pr-3">
        {p.activitiesCompleted.length} / {lab.activityCount}
      </td>
      <td className="py-2 pr-3">{rows}</td>
      <td className="py-2 pr-3">
        {correct} / {attempts.value.length}
      </td>
      <td className="py-2 pr-3">{p.reportsGenerated}</td>
      <td className="py-2">
        {p.lastOpened ? new Date(p.lastOpened).toLocaleString() : t('progress.never')}
      </td>
    </tr>
  );
}

export default function ProgressPage() {
  useDocumentTitle(t('progress.title'));
  const progress = useStoredValue<ProgressRecord>(PROGRESS_KEY, {});
  const built = MODULES.flatMap((m) => {
    const lab = builtLab(m.id);
    return lab ? [{ module: m, lab }] : [];
  });
  return (
    <>
      <PageHeader title={t('progress.title')} intro={t('progress.intro')} icon="progress" />
      <div className="space-y-4">
        <Panel title={t('progress.title')}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-navy-200 text-navy-800">
                  <th scope="col" className="py-2 pr-3">
                    {t('progress.module')}
                  </th>
                  <th scope="col" className="py-2 pr-3">
                    {t('progress.activities')}
                  </th>
                  <th scope="col" className="py-2 pr-3">
                    {t('progress.rows')}
                  </th>
                  <th scope="col" className="py-2 pr-3">
                    {t('progress.attempts')}
                  </th>
                  <th scope="col" className="py-2 pr-3">
                    {t('progress.reports')}
                  </th>
                  <th scope="col" className="py-2">
                    {t('progress.lastOpened')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {built.map(({ module, lab }) => (
                  <ProgressRow
                    key={module.id}
                    module={module}
                    lab={lab}
                    progress={progress.value}
                  />
                ))}
              </tbody>
            </table>
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
