import { useEffect } from 'react';
import { t } from '@/i18n';

/** Sets the browser tab title to "<page> · VADL". */
export function useDocumentTitle(pageTitle: string): void {
  useEffect(() => {
    document.title = `${pageTitle} · ${t('app.shortName')}`;
  }, [pageTitle]);
}
