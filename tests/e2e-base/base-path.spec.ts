import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

/**
 * A build for a sub-folder (VADL_BASE=/vadl/) opens deep links, navigates
 * inside the sub-folder and loads every asset (docs/guides/deployment.md).
 */
test('sub-folder build: deep link, navigation and assets', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/vadl/modules/pneumatics');
  await expect(page.getByRole('heading', { level: 1, name: 'Pneumatics' })).toBeVisible();
  await page.getByRole('link', { name: 'Progress' }).first().click();
  await expect(page).toHaveURL(/\/vadl\/progress$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});

test('the build carries the 404.html fallback for hosts without rewrites', () => {
  const index = readFileSync('dist-base/index.html', 'utf8');
  expect(readFileSync('dist-base/404.html', 'utf8')).toBe(index);
  expect(index).toContain('src="/vadl/assets/');
});
