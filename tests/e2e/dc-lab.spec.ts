import { expect, test, type Page } from '@playwright/test';

/**
 * Milestone 4: the DC motor laboratory end to end in a real browser, on real
 * animation frames, at laptop and tablet sizes.
 */

const reading = (page: Page, name: string) =>
  page.getByRole('group', { name, exact: true }).getByTestId('measurement-value');

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test('separately excited motor reaches RC-M01-01 and armature-voltage control works', async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto('/modules/dc-motor-drives');
  await page.getByRole('button', { name: 'Start' }).click();

  // Steady state of RC-M01-01: 1671 rpm, 20 A, 24 N·m, 90.91 % overall.
  await expect(reading(page, 'Speed')).toHaveText('1671', { timeout: 10_000 });
  await expect(reading(page, 'Armature current')).toHaveText('20');
  await expect(reading(page, 'Efficiency')).toHaveText('90.91');
  await page.getByRole('button', { name: 'Record measurement' }).click();

  // Live armature-voltage control: Va 180 V → ω = (180 − 10)/1.2 = 141.667 rad/s = 1352.8 rpm.
  await page.getByLabel(/Armature voltage Va \(V\)/).fill('180');
  await expect(reading(page, 'Speed')).toHaveText('1353', { timeout: 10_000 });
  await page.getByRole('button', { name: 'Record measurement' }).click();

  const table = page.getByRole('table', { name: /Recorded measurements/ });
  await expect(table.getByRole('row')).toHaveCount(3);

  // Characteristic: motor and load curves plus the operating point.
  const chart = page.getByTestId('characteristic-chart');
  await expect(chart.locator('path.recharts-curve')).toHaveCount(2);
  await expect(chart.locator('.recharts-reference-dot')).toHaveCount(1);

  // Recorded rows survive a reload (browser storage).
  await page.reload();
  await expect(
    page.getByRole('table', { name: /Recorded measurements/ }).getByRole('row'),
  ).toHaveCount(3);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('converter-fed drive reaches RC-M01-02 (45 A, 58.95 rad/s)', async ({ page }) => {
  await page.goto('/modules/dc-motor-drives');
  await page.getByRole('button', { name: 'Converter-fed' }).click();
  await expect(reading(page, 'Armature voltage')).toHaveText('198.1');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(reading(page, 'Armature current')).toHaveText('45', { timeout: 10_000 });
  await expect(reading(page, 'Angular speed')).toHaveText('58.95');
});

test('assessment gives immediate feedback; report and progress use the recorded data', async ({
  page,
}) => {
  await page.goto('/modules/dc-motor-drives');
  await page.getByRole('button', { name: 'Record measurement' }).click(); // at rest: a real, if dull, row
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(reading(page, 'Speed')).toHaveText('1671', { timeout: 10_000 });
  await page.getByRole('button', { name: 'Record measurement' }).click();

  const q1 = page.locator('article[data-question-id="m01.mcq.back-emf"]');
  await q1.getByLabel(/The motor constant, the field current and the speed/).check();
  await q1.getByRole('button', { name: 'Check answer' }).click();
  await expect(q1.getByRole('status')).toContainText('Correct.');

  await page.getByRole('link', { name: 'Open laboratory report' }).click();
  await expect(page.getByTestId('lab-report')).toBeVisible();
  await expect(page.getByTestId('report-graph')).toBeVisible();
  await expect(page.getByText('Drawn from your 2 recorded rows only.')).toBeVisible();
  await expect(page.getByTestId('report-score')).toHaveText(
    'Correct answers (marked by VADL): 1 of 1 attempts.',
  );

  // The print dialog cannot be driven headless; replace it and check the button calls it.
  await page.evaluate(() => {
    (window as unknown as { printed: number }).printed = 0;
    window.print = () => {
      (window as unknown as { printed: number }).printed += 1;
    };
  });
  await page.getByRole('button', { name: 'Print or save as PDF' }).click();
  expect(await page.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(1);

  await page.goto('/progress');
  const row = page.locator('tr[data-module-id="m01-dc-motor"]');
  await expect(row).toContainText('2'); // rows recorded
  await expect(row).toContainText('1 / 1'); // correct answers
});

test('print layout hides the application chrome', async ({ page }) => {
  await page.goto('/reports/m01-dc-motor');
  await expect(page.getByTestId('lab-report')).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeHidden();
  await expect(page.getByTestId('designer-badge')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Print or save as PDF' })).toBeHidden();
  await expect(page.getByRole('heading', { name: /1\. Student identification/ })).toBeVisible();
});
