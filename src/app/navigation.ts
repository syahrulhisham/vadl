import type { IconName } from '@/design-system';

/** One entry in the primary navigation: the eight dashboard areas of master instruction §6. */
export interface NavItem {
  readonly path: string;
  readonly labelKey: string;
  readonly icon: IconName;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', labelKey: 'nav.welcome', icon: 'home' },
  { path: '/overview', labelKey: 'nav.overview', icon: 'overview' },
  { path: '/modules', labelKey: 'nav.modules', icon: 'modules' },
  { path: '/resources', labelKey: 'nav.resources', icon: 'resources' },
  { path: '/activities', labelKey: 'nav.activities', icon: 'activities' },
  { path: '/assessment', labelKey: 'nav.assessment', icon: 'assessment' },
  { path: '/progress', labelKey: 'nav.progress', icon: 'progress' },
  { path: '/reports', labelKey: 'nav.reports', icon: 'reports' },
];
