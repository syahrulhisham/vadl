import { expect, test, type Page } from '@playwright/test';

/**
 * Milestone 2 end-to-end checks, run at laptop (1366 × 768) and tablet
 * (768 × 1024) sizes — the `laptop` and `tablet` projects in playwright.config.ts.
 */

const AREAS: [string, string][] = [
  ['Welcome', 'Virtual Actuator and Drives Laboratory'],
  ['Laboratory overview', 'Laboratory overview'],
  ['Laboratory modules', 'Laboratory modules'],
  ['Learning resources', 'Learning resources'],
  ['Experiment activities', 'Experiment activities'],
  ['Assessment centre', 'Assessment centre'],
  ['Student progress', 'Student progress'],
  ['Laboratory reports', 'Laboratory reports'],
];

const REGIONS = [
  'Theory',
  'Simulation workspace',
  'Parameter controls',
  'Measurements',
  'Graphs',
  'Experiment instructions',
  'Assessment',
];

function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

/** On tablets the navigation sits behind the Menu button. */
async function openNavIfCollapsed(page: Page) {
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  if (await menu.isVisible()) await menu.click();
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

test('home page loads with header, badge and disclaimer', async ({ page }) => {
  const errors = trackConsoleErrors(page);
  await page.goto('/');
  await expect(page).toHaveTitle('Welcome · VADL');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Virtual Actuator and Drives Laboratory' }),
  ).toBeVisible();
  await expect(page.getByTestId('designer-badge')).toHaveText('Design by Syahrul Hisham™');
  await expect(page.getByText(/simplified educational model/i)).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('every dashboard area is reachable from the navigation', async ({ page }) => {
  const errors = trackConsoleErrors(page);
  await page.goto('/');
  for (const [link, heading] of AREAS) {
    await openNavIfCollapsed(page);
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: link, exact: true })
      .click();
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    expect(await horizontalOverflow(page), `horizontal scroll on ${link}`).toBeLessThanOrEqual(0);
  }
  expect(errors).toEqual([]);
});

test('a module page shows the seven-region laboratory layout', async ({ page }) => {
  const errors = trackConsoleErrors(page);
  await page.goto('/modules');
  await page.getByRole('link', { name: /DC Motor Drives/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'DC Motor Drives' })).toBeVisible();
  const shell = page.getByTestId('lab-shell');
  for (const name of REGIONS) {
    await expect(shell.getByRole('region', { name, exact: true })).toBeVisible();
  }
  await expect(shell.getByRole('region')).toHaveCount(7);
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('deep links to module pages work after a reload', async ({ page }) => {
  await page.goto('/modules/electrohydraulics');
  await expect(page.getByRole('heading', { level: 1, name: 'Electrohydraulics' })).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('lab-shell').getByRole('region')).toHaveCount(7);
});

test('measurement values are at least 20 px and show no invented number (NFR-04)', async ({
  page,
}) => {
  // A planned module: its sample readout must show a dash, never a number.
  await page.goto('/modules/mechanical-transmission');
  const value = page.getByTestId('measurement-value').first();
  await expect(value).toHaveText('—');
  const px = await value.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(px).toBeGreaterThanOrEqual(20);
});

test('navigation links and buttons are at least 44 px tall (NFR-03)', async ({ page }) => {
  await page.goto('/');
  await openNavIfCollapsed(page);
  const targets = page.locator(
    'nav[aria-label="Main navigation"] a, main a[class*="min-h-touch"], header button',
  );
  const count = await targets.count();
  expect(count).toBeGreaterThanOrEqual(8);
  for (let i = 0; i < count; i += 1) {
    const box = await targets.nth(i).boundingBox();
    if (box) expect(box.height, `target ${i}`).toBeGreaterThanOrEqual(44);
  }
});

test('the first Tab reaches the skip link, which moves focus to the content', async ({ page }) => {
  await page.goto('/overview');
  await expect(page.getByRole('heading', { level: 1, name: 'Laboratory overview' })).toBeVisible();
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('tablet menu opens and closes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'tablet', 'The menu button exists only below 1024 px');
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav).toBeHidden();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(nav).toBeVisible();
  await nav.getByRole('link', { name: 'Laboratory reports' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Laboratory reports' })).toBeVisible();
  await expect(nav).toBeHidden();
  // Choosing the page you are already on also closes the menu.
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await nav.getByRole('link', { name: 'Laboratory reports' }).click();
  await expect(nav).toBeHidden();
});
