import { useEffect, useState } from 'react';
import { LinkButton, PageHeader, Panel } from '@/design-system';
import { moduleProgress, type ProgressRecord } from '@/features/progress';
import { EMPTY_DRAFT, type ExperimentSession, type ReportDraft } from '@/features/reports';
import { t } from '@/i18n';
import { moduleTitle } from '@/modules/courseRefs';
import { builtLab } from '@/modules/labs';
import { MODULES } from '@/modules/registry';
import { PROGRESS_KEY, reportKey, sessionsKey, useRepository, type Repository } from '@/storage';
import { useDocumentTitle } from '../useDocumentTitle';

interface Status {
  readonly rows: number;
  readonly drafted: boolean;
  readonly printed: number;
}

const AVAILABLE = MODULES.filter((m) => builtLab(m.id));

async function fetchStatus(repository: Repository): Promise<Record<string, Status>> {
  const progress = (await repository.get<ProgressRecord>(PROGRESS_KEY)) ?? {};
  const entries = await Promise.all(
    AVAILABLE.map(async (m) => {
      const sessions = (await repository.get<ExperimentSession[]>(sessionsKey(m.id))) ?? [];
      const draft = (await repository.get<ReportDraft>(reportKey(m.id))) ?? EMPTY_DRAFT;
      return [
        m.id,
        {
          rows: sessions.reduce((n, s) => n + s.rows.length, 0),
          drafted: draft.discussion.trim() !== '' || draft.conclusion.trim() !== '',
          printed: moduleProgress(progress, m.id).reportsGenerated,
        },
      ] as const;
    }),
  );
  return Object.fromEntries(entries);
}

/** Laboratory reports for all ten laboratories, with each report's status (FR-13). */
export default function ReportsPage() {
  useDocumentTitle(t('reports.title'));
  const { repository } = useRepository();
  const [status, setStatus] = useState<Record<string, Status>>({});

  useEffect(() => {
    let cancelled = false;
    void fetchStatus(repository).then((s) => {
      if (!cancelled) setStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  return (
    <>
      <PageHeader title={t('reports.title')} intro={t('reports.intro')} icon="reports" />
      <div className="space-y-4">
        <Panel title={t('reports.available')}>
          <ul className="space-y-3">
            {AVAILABLE.map((m) => {
              const s = status[m.id];
              return (
                <li key={m.id} className="flex flex-wrap items-center gap-3" data-module-id={m.id}>
                  <span className="min-w-[16rem] font-medium text-navy-900">
                    {m.number}. {moduleTitle(m)}
                  </span>
                  <LinkButton to={`/reports/${m.id}`} variant="secondary">
                    {t('reports.open')}
                  </LinkButton>
                  {s ? (
                    <span className="text-sm text-navy-700" data-testid={`report-status-${m.id}`}>
                      {t('reports.status', {
                        rows: s.rows,
                        draft: s.drafted ? t('reports.drafted') : t('reports.notDrafted'),
                        printed: s.printed,
                      })}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel title={t('reports.title')} tone="info">
          <p>{t('reports.honesty')}</p>
          <p className="mt-2">{t('app.privacy')}</p>
        </Panel>
      </div>
    </>
  );
}
