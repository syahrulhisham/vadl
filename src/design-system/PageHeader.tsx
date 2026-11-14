import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export interface PageHeaderProps {
  readonly title: string;
  readonly intro?: string;
  readonly icon?: IconName;
  readonly eyebrow?: string;
  readonly children?: ReactNode;
}

/** The single <h1> of a page, with optional introduction text. */
export function PageHeader({ title, intro, icon, eyebrow, children }: PageHeaderProps) {
  return (
    <header className="mb-6">
      {eyebrow ? <p className="text-sm font-medium text-navy-500">{eyebrow}</p> : null}
      <h1 className="flex items-center gap-3 text-2xl font-semibold text-navy-800 sm:text-3xl">
        {icon ? <Icon name={icon} className="h-7 w-7 shrink-0 text-navy-600" /> : null}
        {title}
      </h1>
      {intro ? <p className="mt-2 max-w-3xl text-navy-700">{intro}</p> : null}
      {children}
    </header>
  );
}
