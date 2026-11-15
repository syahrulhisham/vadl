// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppRoutes, NAV_ITEMS } from '@/app';
import { LAB_REGIONS } from '@/features/lab-shell';
import { MODULES } from '@/modules/registry';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

const AREAS: [string, string][] = [
  ['/', 'Virtual Actuator and Drives Laboratory'],
  ['/overview', 'Laboratory overview'],
  ['/modules', 'Laboratory modules'],
  ['/resources', 'Learning resources'],
  ['/activities', 'Experiment activities'],
  ['/assessment', 'Assessment centre'],
  ['/progress', 'Student progress'],
  ['/reports', 'Laboratory reports'],
];

describe('navigation (master instruction §6)', () => {
  it('lists exactly the eight dashboard areas, each with a unique path', () => {
    expect(NAV_ITEMS).toHaveLength(8);
    expect(new Set(NAV_ITEMS.map((i) => i.path)).size).toBe(8);
    expect(NAV_ITEMS.map((i) => i.path)).toEqual(AREAS.map(([p]) => p));
  });

  it('shows the eight links, the designer badge and the disclaimer on every page', async () => {
    renderAt('/');
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(nav).getAllByRole('link')).toHaveLength(8);
    expect(screen.getByTestId('designer-badge')).toHaveTextContent('Design by Syahrul Hisham™');
    expect(screen.getByText(/simplified educational model/i)).toBeInTheDocument();
    await screen.findByRole('heading', { level: 1 });
  });

  it('provides a skip link to the main content', () => {
    renderAt('/');
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main',
    );
    expect(document.getElementById('main')).not.toBeNull();
  });
});

describe('routes', () => {
  it.each(AREAS)('%s renders the page heading "%s"', async (path, heading) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

  it('marks the current area in the navigation', async () => {
    renderAt('/reports');
    await screen.findByRole('heading', { level: 1, name: 'Laboratory reports' });
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(nav).getByRole('link', { name: 'Laboratory reports' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Welcome' })).not.toHaveAttribute('aria-current');
  });

  it('sets the document title per page', async () => {
    renderAt('/assessment');
    await screen.findByRole('heading', { level: 1, name: 'Assessment centre' });
    expect(document.title).toBe('Assessment centre · VADL');
  });

  it('shows a not-found page for unknown addresses', async () => {
    renderAt('/no-such-page');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument();
  });

  it('lists all ten modules with links to their pages', async () => {
    renderAt('/modules');
    const list = await screen.findByRole('list', { name: 'Laboratory modules' });
    const links = within(list).getAllByRole('link');
    expect(links).toHaveLength(10);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(
      MODULES.map((m) => `/modules/${m.slug}`),
    );
  });

  it('shows the course mapping on the overview page', async () => {
    renderAt('/overview');
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(11);
    expect(within(table).getByText('Lab 1 — Single-phase AC–DC converters')).toBeInTheDocument();
  });
});

describe('module pages (FR-02)', () => {
  it.each(MODULES.map((m) => [m.slug, m.number] as const))(
    '/modules/%s shows the seven regions',
    async (slug) => {
      renderAt(`/modules/${slug}`);
      const shell = await screen.findByTestId('lab-shell');
      const regions = within(shell).getAllByRole('region');
      expect(regions).toHaveLength(7);
      expect(regions.map((r) => r.querySelector('h2')?.textContent)).toEqual([
        'Theory',
        'Simulation workspace',
        'Parameter controls',
        'Measurements',
        'Graphs',
        'Experiment instructions',
        'Assessment',
      ]);
      expect(LAB_REGIONS).toHaveLength(7);
    },
  );

  it('a planned module shows its title, course reference and placeholder milestone', async () => {
    renderAt('/modules/stepper-motors');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Stepper Motors' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Course reference: Chapter 2, Part I/)).toBeInTheDocument();
    expect(
      screen.getAllByText('This region is filled when the laboratory is built in Milestone 6.'),
    ).toHaveLength(7);
  });

  it('the DC motor module shows its built laboratory, not placeholders', async () => {
    renderAt('/modules/dc-motor-drives');
    expect(await screen.findByTestId('dc-diagram')).toBeInTheDocument();
    expect(screen.getByText(/Course reference: Chapter 1, Parts I–III/)).toBeInTheDocument();
    expect(screen.queryByText(/This region is filled when the laboratory is built/)).toBeNull();
  });

  it('never shows an invented measurement value', async () => {
    renderAt('/modules/pneumatics');
    await screen.findByTestId('lab-shell');
    for (const v of screen.getAllByTestId('measurement-value')) expect(v).toHaveTextContent('—');
  });

  it('handles an unknown module address', async () => {
    renderAt('/modules/warp-drive');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Laboratory not found' }),
    ).toBeInTheDocument();
  });
});

describe('tablet menu', () => {
  it('toggles the navigation and closes after navigating', async () => {
    renderAt('/');
    await screen.findByRole('heading', { level: 1 });
    const toggle = screen.getByRole('button', { name: 'Menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    const close = screen.getByRole('button', { name: 'Close menu' });
    expect(close).toHaveAttribute('aria-expanded', 'true');
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    fireEvent.click(within(nav).getByRole('link', { name: 'Student progress' }));
    await screen.findByRole('heading', { level: 1, name: 'Student progress' });
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes when the current page is chosen again', async () => {
    renderAt('/progress');
    await screen.findByRole('heading', { level: 1, name: 'Student progress' });
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    fireEvent.click(within(nav).getByRole('link', { name: 'Student progress' }));
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
  });
});
