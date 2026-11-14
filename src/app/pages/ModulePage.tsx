import { Link, useParams } from 'react-router';
import { LinkButton, PageHeader, StatusBadge } from '@/design-system';
import { LabShell } from '@/features/lab-shell';
import { t } from '@/i18n';
import { moduleChapter, moduleCourseLab, moduleSummary, moduleTitle } from '@/modules/courseRefs';
import { findModuleBySlug } from '@/modules/registry';
import { useDocumentTitle } from '../useDocumentTitle';

export default function ModulePage() {
  const { slug = '' } = useParams();
  const module = findModuleBySlug(slug);
  useDocumentTitle(module ? moduleTitle(module) : t('module.notFoundTitle'));

  if (!module) {
    return (
      <>
        <PageHeader title={t('module.notFoundTitle')} intro={t('module.notFound')} />
        <LinkButton to="/modules" variant="secondary">
          {t('module.backToList')}
        </LinkButton>
      </>
    );
  }

  const lab = moduleCourseLab(module);
  const courseRef = lab ? `${moduleChapter(module)} · ${lab}` : moduleChapter(module);

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-2 text-sm">
        <Link
          to="/modules"
          className="inline-flex min-h-touch items-center text-navy-600 underline-offset-2 hover:underline"
        >
          {t('module.backToList')}
        </Link>
      </nav>
      <PageHeader
        title={moduleTitle(module)}
        intro={moduleSummary(module)}
        eyebrow={t('module.number', { n: module.number })}
      >
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <StatusBadge>{t(`module.status.${module.status}`, { m: module.milestone })}</StatusBadge>
          <span className="text-sm text-navy-600">{t('module.courseRef', { ref: courseRef })}</span>
        </div>
      </PageHeader>
      <LabShell placeholderMilestone={module.milestone} />
    </>
  );
}
