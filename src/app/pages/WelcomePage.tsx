import { Icon, LinkButton, PageHeader, Panel } from '@/design-system';
import { t } from '@/i18n';
import { useDocumentTitle } from '../useDocumentTitle';

const STEPS = ['welcome.how1', 'welcome.how2', 'welcome.how3', 'welcome.how4'];

export default function WelcomePage() {
  useDocumentTitle(t('nav.welcome'));
  return (
    <>
      <PageHeader title={t('welcome.title')} intro={t('welcome.intro')} eyebrow={t('app.course')}>
        <div className="mt-4 flex flex-wrap gap-3">
          <LinkButton to="/modules">
            {t('welcome.start')}
            <Icon name="arrowRight" className="h-5 w-5" />
          </LinkButton>
          <LinkButton to="/overview" variant="secondary">
            {t('welcome.overview')}
          </LinkButton>
        </div>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title={t('welcome.howTitle')}>
          <ol className="list-decimal space-y-1 pl-5">
            {STEPS.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ol>
        </Panel>
        <Panel title={t('welcome.statusTitle')} tone="info">
          <p>{t('welcome.status')}</p>
        </Panel>
      </div>
    </>
  );
}
