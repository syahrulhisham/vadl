import { Link, useParams } from 'react-router';
import { PageHeader } from '@/design-system';
import { ReportView } from '@/features/reports';
import { t } from '@/i18n';
import { builtLab } from '@/modules/labs';
import { useDocumentTitle } from '../useDocumentTitle';

export default function ReportPage() {
  const { moduleId = '' } = useParams();
  const lab = builtLab(moduleId);
  useDocumentTitle(lab ? lab.report.title : t('report.notFound'));
  if (!lab) return <PageHeader title={t('reports.title')} intro={t('report.notFound')} />;
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-2 text-sm print:hidden">
        <Link
          to="/reports"
          className="inline-flex min-h-touch items-center text-navy-600 underline-offset-2 hover:underline"
        >
          {t('reports.title')}
        </Link>
      </nav>
      <PageHeader title={lab.report.title} />
      <ReportView definition={lab.report} questions={lab.questions} />
    </>
  );
}
