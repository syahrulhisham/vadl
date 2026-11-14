import { Link } from 'react-router';
import { PageHeader, StatusBadge } from '@/design-system';
import { t } from '@/i18n';
import { moduleSummary, moduleTitle } from '@/modules/courseRefs';
import { MODULES } from '@/modules/registry';
import { useDocumentTitle } from '../useDocumentTitle';

export default function ModulesPage() {
  useDocumentTitle(t('modules.title'));
  return (
    <>
      <PageHeader title={t('modules.title')} intro={t('modules.intro')} icon="modules" />
      <ul
        aria-label={t('modules.listLabel')}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {MODULES.map((m) => (
          <li key={m.id} data-module-id={m.id}>
            <Link
              to={`/modules/${m.slug}`}
              className="flex h-full min-h-touch flex-col rounded-lg border border-navy-100 bg-white p-4 shadow-sm transition-colors hover:border-navy-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lightblue-400"
            >
              <span className="text-sm font-medium text-navy-500">
                {t('module.number', { n: m.number })}
              </span>
              <span className="mt-1 text-lg font-semibold text-navy-800">{moduleTitle(m)}</span>
              <span className="mt-1 flex-1 text-sm text-navy-700">{moduleSummary(m)}</span>
              <span className="mt-3">
                <StatusBadge>{t(`module.status.${m.status}`, { m: m.milestone })}</StatusBadge>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
