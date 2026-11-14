/**
 * Dashboard areas that hold no laboratory data yet: learning resources,
 * experiment activities, assessment centre, student progress and laboratory
 * reports. Each states what it will contain and when, and invents nothing.
 */
import { LinkButton, PageHeader, Panel, StatusBadge } from '@/design-system';
import { t } from '@/i18n';
import { useDocumentTitle } from '../useDocumentTitle';

function ComingIn({ milestone }: { readonly milestone: number }) {
  return (
    <div className="mt-3">
      <StatusBadge>{t('comingIn', { m: milestone })}</StatusBadge>
    </div>
  );
}

export function ResourcesPage() {
  useDocumentTitle(t('resources.title'));
  return (
    <>
      <PageHeader title={t('resources.title')} intro={t('resources.intro')} icon="resources">
        <ComingIn milestone={4} />
      </PageHeader>
      <Panel title={t('resources.symbolsTitle')} tone="info">
        <p>{t('resources.symbols')}</p>
      </Panel>
    </>
  );
}

export function ActivitiesPage() {
  useDocumentTitle(t('activities.title'));
  return (
    <>
      <PageHeader title={t('activities.title')} intro={t('activities.intro')} icon="activities">
        <ComingIn milestone={4} />
      </PageHeader>
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

export function AssessmentPage() {
  useDocumentTitle(t('assessment.title'));
  return (
    <>
      <PageHeader title={t('assessment.title')} intro={t('assessment.intro')} icon="assessment">
        <ComingIn milestone={4} />
      </PageHeader>
      <Panel title={t('nav.assessment')} tone="info">
        <p>{t('assessment.purpose')}</p>
      </Panel>
    </>
  );
}

export function ProgressPage() {
  useDocumentTitle(t('progress.title'));
  return (
    <>
      <PageHeader title={t('progress.title')} intro={t('progress.intro')} icon="progress" />
      <Panel title={t('progress.title')} tone="info">
        <p>{t('progress.empty')}</p>
        <p className="mt-2">{t('app.privacy')}</p>
      </Panel>
    </>
  );
}

export function ReportsPage() {
  useDocumentTitle(t('reports.title'));
  return (
    <>
      <PageHeader title={t('reports.title')} intro={t('reports.intro')} icon="reports" />
      <Panel title={t('reports.title')} tone="info">
        <p>{t('reports.empty')}</p>
        <p className="mt-2">{t('reports.honesty')}</p>
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
