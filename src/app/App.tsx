import { t } from '@/i18n';
import { MODULES } from '@/modules/registry';

/**
 * Application shell, Milestone 1. Proves the toolchain end to end: React,
 * Tailwind tokens, the language file and the module registry. Routing, the
 * eight dashboard areas and the design system arrive in Milestone 2.
 */
export function App() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-navy-900">
      <header className="border-b border-navy-100 bg-navy-800 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xl font-semibold tracking-tight">
              {t('app.shortName')}
              <span className="ml-2 hidden font-normal text-navy-100 sm:inline">
                {t('app.name')}
              </span>
            </p>
            <p className="text-sm text-lightblue-200">{t('app.course')}</p>
          </div>
          <span
            data-testid="designer-badge"
            className="rounded-full border border-lightblue-300 px-3 py-1 text-sm text-lightblue-100"
          >
            {t('app.badge')}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-semibold text-navy-800">{t('app.name')}</h1>
        <p className="mt-2 max-w-3xl text-navy-700">{t('home.intro')}</p>
        <p
          role="status"
          className="mt-4 rounded-md border border-lightblue-200 bg-lightblue-50 px-4 py-3 text-navy-700"
        >
          {t('home.notice')}
        </p>

        <h2 className="mt-8 text-2xl font-semibold text-navy-800">{t('home.heading')}</h2>
        <ul
          aria-label={t('home.heading')}
          className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {MODULES.map((m) => (
            <li
              key={m.id}
              data-module-id={m.id}
              className="min-h-[44px] rounded-lg border border-navy-100 bg-white p-4 shadow-sm"
            >
              <p className="text-sm font-medium text-navy-500">
                {t('module.number', { n: m.number })}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-navy-800">{t(m.titleKey)}</h3>
              <p className="mt-2 text-sm text-navy-600">
                {t(`module.status.${m.status}`, { m: m.milestone })}
              </p>
            </li>
          ))}
        </ul>
      </main>

      <footer className="border-t border-navy-100 bg-lightblue-50">
        <p className="mx-auto max-w-6xl px-4 py-4 text-sm text-navy-700">{t('home.disclaimer')}</p>
      </footer>
    </div>
  );
}
