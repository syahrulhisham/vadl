import { expect, test } from '@playwright/test';

/**
 * Home page loads at laptop (1366 × 768) and tablet (768 × 1024) sizes.
 * The two sizes are the `laptop` and `tablet` projects in playwright.config.ts.
 */
test('home page loads with header, ten modules and no horizontal scroll', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/');

  await expect(page).toHaveTitle(/VADL/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Virtual Actuator and Drives Laboratory' }),
  ).toBeVisible();
  await expect(page.getByTestId('designer-badge')).toHaveText('Design by Syahrul Hisham™');

  const modules = page.getByRole('list', { name: 'Laboratory modules' }).getByRole('listitem');
  await expect(modules).toHaveCount(10);
  await expect(modules.first()).toBeVisible();

  // NFR-03: layout fits the viewport width without horizontal scrolling.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  expect(consoleErrors).toEqual([]);
});
