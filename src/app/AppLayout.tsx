import { Suspense, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { Icon } from '@/design-system';
import { t } from '@/i18n';
import { NAV_ITEMS } from './navigation';

/**
 * Application frame: skip link, header with the designer badge (D6), primary
 * navigation to the eight dashboard areas, the routed page, and the footer
 * disclaimer (NFR-12).
 *
 * Below 1024 px (tablets) the navigation collapses behind a Menu button; at
 * 1024 px and above it is a fixed sidebar.
 */
export function AppLayout() {
  const { pathname } = useLocation();
  // The tablet menu is open only on the page where it was opened, so it closes
  // itself after navigation without an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const menuOpen = openedOn === pathname;
  const setMenuOpen = (toggle: (open: boolean) => boolean) =>
    setOpenedOn(toggle(menuOpen) ? pathname : null);

  return (
    <div className="flex min-h-screen flex-col bg-white text-navy-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:text-navy-900 focus:shadow"
      >
        {t('app.skipToContent')}
      </a>

      <header className="bg-navy-800 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-md hover:bg-navy-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lightblue-300 lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="primary-nav"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Icon
                name={menuOpen ? 'close' : 'menu'}
                label={menuOpen ? t('nav.closeMenu') : t('nav.menu')}
              />
            </button>
            <NavLink
              to="/"
              className="rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-lightblue-300"
            >
              <span className="block text-xl font-semibold tracking-tight">
                {t('app.shortName')}
                <span className="ml-2 hidden font-normal text-white md:inline">
                  {t('app.name')}
                </span>
              </span>
              <span className="block text-sm text-lightblue-200">{t('app.course')}</span>
            </NavLink>
          </div>
          <span
            data-testid="designer-badge"
            className="rounded-full border border-lightblue-300 px-3 py-1 text-sm text-lightblue-100"
          >
            {t('app.badge')}
          </span>
        </div>
      </header>

      <div className="relative flex flex-1">
        <nav
          id="primary-nav"
          aria-label={t('nav.label')}
          className={`${menuOpen ? 'block' : 'hidden'} absolute inset-x-0 z-40 border-b border-navy-100 bg-white shadow-lg lg:static lg:block lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:shadow-none`}
        >
          <ul className="space-y-1 p-3">
            {NAV_ITEMS.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setOpenedOn(null)}
                  className={({ isActive }) =>
                    `flex min-h-touch items-center gap-3 rounded-md px-3 py-2 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-lightblue-400 ${
                      isActive
                        ? 'bg-lightblue-100 font-semibold text-navy-900'
                        : 'text-navy-700 hover:bg-navy-50'
                    }`
                  }
                >
                  <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                  {t(item.labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main
          id="main"
          tabIndex={-1}
          className="min-w-0 flex-1 px-4 py-6 focus:outline-none lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <Suspense fallback={<p role="status">{t('app.loading')}</p>}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

      <footer className="border-t border-navy-100 bg-lightblue-50">
        <div className="space-y-1 px-4 py-4 text-sm text-navy-700 lg:px-8">
          <p>{t('app.disclaimer')}</p>
          <p>{t('app.privacy')}</p>
        </div>
      </footer>
    </div>
  );
}
