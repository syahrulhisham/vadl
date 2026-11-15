import { expect, test, type Page } from '@playwright/test';

/**
 * Milestone 10 integration pass: every laboratory runs, records a row and feeds
 * its report, in every supported browser (NFR-11: Chrome, Edge, Firefox, Safari
 * via WebKit). Runs in all Playwright projects.
 */

const LABS: readonly (readonly [slug: string, id: string, title: string])[] = [
  ['dc-motor-drives', 'm01-dc-motor', 'DC Motor Drives'],
  ['ac-motor-drives', 'm02-ac-motor', 'AC Motor Drives'],
  ['power-converters', 'm03-power-converters', 'Power Converters'],
  ['stepper-motors', 'm04-stepper', 'Stepper Motors'],
  ['servo-motors', 'm05-servo', 'Servo Motors'],
  ['mechanical-transmission', 'm06-transmission', 'Mechanical Transmission'],
  ['cam-and-follower', 'm07-cam-follower', 'Cam and Follower'],
  ['pneumatics', 'm08-pneumatics', 'Pneumatics'],
  ['electro-pneumatics', 'm09-electro-pneumatics', 'Electro-Pneumatics'],
  ['electrohydraulics', 'm10-electrohydraulics', 'Electrohydraulics'],
];

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

async function overflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

for (const [slug, id, title] of LABS) {
  test(`${title}: runs, records a row and feeds its report`, async ({ page }) => {
    test.slow();
    const errors = trackErrors(page);
    await page.goto(`/modules/${slug}`);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.getByTestId('lab-shell').getByRole('region')).toHaveCount(7);
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.getByTestId('run-status')).toHaveText('Running');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Record measurement' }).click();
    await expect(
      page.getByRole('table', { name: /Recorded measurements/ }).getByRole('row'),
    ).toHaveCount(2);
    await page.getByRole('button', { name: 'Stop' }).click();
    expect(await overflow(page)).toBeLessThanOrEqual(0);

    await page.goto(`/reports/${id}`);
    const report = page.getByTestId('lab-report');
    await expect(report).toBeVisible();
    await expect(report.locator('[data-section]')).toHaveCount(10);
    await expect(
      report.locator('[data-section="recorded-measurements"] table tbody tr'),
    ).toHaveCount(1);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}

test('every dashboard area loads from a deep link', async ({ page }) => {
  const errors = trackErrors(page);
  for (const path of [
    '/',
    '/overview',
    '/modules',
    '/resources',
    '/activities',
    '/assessment',
    '/progress',
    '/reports',
  ]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await overflow(page), path).toBeLessThanOrEqual(0);
  }
  expect(errors).toEqual([]);
});
