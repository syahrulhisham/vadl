import { PageHeader, Panel } from '@/design-system';
import { t } from '@/i18n';
import { moduleChapter, moduleCourseLab, moduleTitle } from '@/modules/courseRefs';
import { MODULES } from '@/modules/registry';
import { useDocumentTitle } from '../useDocumentTitle';

export default function OverviewPage() {
  useDocumentTitle(t('overview.title'));
  return (
    <>
      <PageHeader title={t('overview.title')} intro={t('overview.intro')} icon="overview" />
      <div className="space-y-4">
        <Panel title={t('overview.outcomesTitle')} tone="info">
          <ul className="list-disc space-y-1 pl-5">
            <li>{t('overview.lo1')}</li>
            <li>{t('overview.lo2')}</li>
            <li>{t('overview.lo3')}</li>
          </ul>
          <p className="mt-2 text-sm">{t('overview.outcomesProvisional')}</p>
        </Panel>
        <Panel title={t('overview.mapTitle')}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-navy-200 text-navy-800">
                  <th scope="col" className="py-2 pr-3">
                    {t('overview.colModule')}
                  </th>
                  <th scope="col" className="py-2 pr-3">
                    {t('overview.colCourse')}
                  </th>
                  <th scope="col" className="py-2 pr-3">
                    {t('overview.colLab')}
                  </th>
                  <th scope="col" className="py-2">
                    {t('overview.colMilestone')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {MODULES.map((m) => (
                  <tr key={m.id} className="border-b border-navy-100">
                    <th scope="row" className="py-2 pr-3 font-medium text-navy-900">
                      {m.number}. {moduleTitle(m)}
                    </th>
                    <td className="whitespace-nowrap py-2 pr-3">{moduleChapter(m)}</td>
                    <td className="py-2 pr-3">{moduleCourseLab(m) ?? t('overview.none')}</td>
                    <td className="whitespace-nowrap py-2">
                      {t('overview.milestone', { m: m.milestone })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title={t('overview.modelTitle')}>
          <p>{t('overview.model')}</p>
          <p className="mt-2">{t('app.disclaimer')}</p>
        </Panel>
      </div>
    </>
  );
}
