/**
 * Learning resources and experiment activities. Activities live inside each
 * laboratory; these areas lead students to them. The assessment centre has its own page.
 */
import { Link } from 'react-router';
import { Icon, LinkButton, PageHeader, Panel } from '@/design-system';
import { t } from '@/i18n';
import { moduleTitle } from '@/modules/courseRefs';
import { builtLab } from '@/modules/labs';
import { MODULES } from '@/modules/registry';
import { useDocumentTitle } from '../useDocumentTitle';

/** Links to every built laboratory, so these areas lead students to the work. */
function LabLinks({ suffix }: { readonly suffix: string }) {
  const built = MODULES.filter((m) => builtLab(m.id));
  return (
    <ul className="space-y-2">
      {built.map((m) => (
        <li key={m.id}>
          <LinkButton to={`/modules/${m.slug}`} variant="secondary">
            {m.number}. {moduleTitle(m)} — {suffix}
          </LinkButton>
        </li>
      ))}
    </ul>
  );
}

export function ResourcesPage() {
  useDocumentTitle(t('resources.title'));
  return (
    <>
      <PageHeader
        title={t('resources.title')}
        intro={t('resources.intro')}
        icon="resources"
      ></PageHeader>
      <div className="space-y-4">
        <Panel title={t('resources.workedTitle')}>
          <Link
            to="/resources/rl-circuit"
            className="flex min-h-touch items-start gap-3 rounded-md p-2 hover:bg-navy-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lightblue-400"
          >
            <Icon name="arrowRight" className="mt-0.5 h-5 w-5 shrink-0 text-navy-600" />
            <span>
              <span className="block font-medium text-navy-800">{t('resources.rlLink')}</span>
              <span className="block text-sm text-navy-700">{t('resources.rlLinkHint')}</span>
            </span>
          </Link>
        </Panel>
        <Panel title={t('resources.symbolsTitle')} tone="info">
          <p>{t('resources.symbols')}</p>
        </Panel>
      </div>
    </>
  );
}

export function ActivitiesPage() {
  useDocumentTitle(t('activities.title'));
  return (
    <>
      <PageHeader title={t('activities.title')} intro={t('activities.intro')} icon="activities" />
      <Panel title={t('info.availableLabs')} className="mb-4">
        <LabLinks suffix={t('info.activitiesSuffix')} />
      </Panel>
      <Panel title={t('activities.levelsTitle')}>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t('activities.beginner')}</li>
          <li>{t('activities.intermediate')}</li>
          <li>{t('activities.advanced')}</li>
        </ul>
      </Panel>
    </>
  );
}

export function NotFoundPage() {
  useDocumentTitle(t('notFound.title'));
  return (
    <>
      <PageHeader title={t('notFound.title')} intro={t('notFound.body')} />
      <LinkButton to="/" variant="secondary">
        {t('notFound.home')}
      </LinkButton>
    </>
  );
}
