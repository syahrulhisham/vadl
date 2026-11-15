import { expect, test } from '@playwright/test';

/** Milestone 9: assessment centre, progress and reports work together in a real browser. */

test('practice set answer and a lecturer-marked explanation reach progress and the report', async ({
  page,
}) => {
  test.slow();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  // A one-laboratory practice set from the DC motor bank, reproducible by its code.
  await page.goto('/assessment');
  await expect(page.getByTestId('bank-table').getByRole('row')).toHaveCount(11);
  for (const box of await page.getByRole('checkbox').all()) await box.uncheck();
  await page.getByRole('checkbox', { name: /1\. DC Motor Drives/ }).check();
  await page.getByRole('combobox', { name: 'Show questions for level' }).selectOption('beginner');
  await page.getByRole('combobox', { name: 'Number of questions' }).selectOption('5');
  await page.getByRole('textbox', { name: 'Set code (optional)' }).fill('7');
  await page.getByRole('button', { name: 'Create practice set' }).click();
  const card = page.locator('[data-question-id="m01.mcq.back-emf"]');
  await expect(card).toBeVisible();
  await card.getByRole('radio').first().check();
  await card.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByTestId('practice-summary')).toContainText('Answered 1');

  // The explanation question, in the laboratory itself.
  await page.goto('/modules/dc-motor-drives');
  const explain = page.locator('[data-question-id="m01.explain"]');
  await explain.getByRole('textbox').fill('At standstill there is no back-emf, so Ia = Va/Ra.');
  await explain.getByRole('button', { name: 'Save answer' }).click();
  await expect(explain.getByRole('status')).toContainText('Marking guide');

  await page.goto('/progress');
  const dc = page.locator('[data-module-id="m01-dc-motor"]');
  await expect(dc).toContainText('/ 1');
  await expect(dc.locator('td').nth(3)).toHaveText('1');

  await page.goto('/reports/m01-dc-motor');
  await expect(page.getByTestId('report-lecturer')).toContainText('no back-emf');
  await expect(page.getByTestId('report-levels')).toBeVisible();
  expect(errors).toEqual([]);
});

test('progress: backup downloads a file; delete needs confirmation', async ({ page }) => {
  await page.goto('/progress');
  await expect(page.getByTestId('progress-table').getByRole('row')).toHaveCount(12);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Back up all my data' }).click();
  expect((await download).suggestedFilename()).toBe('vadl-backup.json');
  await page.getByRole('button', { name: 'Delete all my VADL data…' }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
});
