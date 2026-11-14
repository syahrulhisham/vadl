import { LinkButton, PageHeader, Panel } from '@/design-system';
import { t } from '@/i18n';
import { moduleTitle } from '@/modules/courseRefs';
import { builtLab } from '@/modules/labs';
import { MODULES } from '@/modules/registry';
import { useDocumentTitle } from '../useDocumentTitle';

export default function ReportsPage() {
  useDocumentTitle(t('reports.title'));
  const available = MODULES.filter((m) => builtLab(m.id));
  return (
    <>
      <PageHeader title={t('reports.title')} intro={t('reports.intro')} icon="reports" />
      <div className="space-y-4">
        <Panel title={t('reports.available')}>
          <ul className="space-y-2">
            {available.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3">
                <span className="font-medium text-navy-900">
                  {m.number}. {moduleTitle(m)}
                </span>
                <LinkButton to={`/reports/${m.id}`} variant="secondary">
                  {t('reports.open')}
                </LinkButton>
              </li>
            ))}
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
