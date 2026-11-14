import { expect, test } from '@playwright/test';

/**
 * Milestone 3 gate: the RL proving model runs end to end in a real browser,
 * on the real animation-frame loop, at laptop and tablet sizes.
 */

test('the RL circuit runs to completion and matches the analytic result', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/resources');
  await page.getByRole('link', { name: /First-order RL circuit/ }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'First-order RL circuit' }),
  ).toBeVisible();
  await expect(page.getByTestId('run-status')).toHaveText(/Ready/);

  // Fastest playback: five time constants in 2 s.
  await page.getByRole('combobox', { name: /Playback/ }).selectOption('2');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByTestId('run-status')).toHaveText('Running');
  await expect(page.getByTestId('run-status')).toHaveText(/Finished at five time constants/, {
    timeout: 15_000,
  });

  // i(5τ) = 0.993262 A (RC-ENG-01); the readout shows 4 significant figures.
  const current = page
    .getByRole('group', { name: 'Current', exact: true })
    .getByTestId('measurement-value');
  await expect(current).toHaveText('0.9933');
  await expect(page.getByTestId('rl-ammeter')).toHaveText('i = 0.993 A');
  await expect(
    page.getByRole('group', { name: 'Time', exact: true }).getByTestId('measurement-value'),
  ).toHaveText('50');

  // Both the simulated and the analytic curve are drawn.
  await expect(page.getByTestId('trace-chart').locator('path.recharts-curve')).toHaveCount(2);
  await expect(page.getByTestId('universal-chart').locator('.recharts-reference-dot')).toHaveCount(
    1,
  );

  // Record a row of the final values.
  await page.getByRole('button', { name: 'Record measurement' }).click();
  const table = page.getByRole('table', { name: /Recorded measurements/ });
  await expect(table.getByRole('row')).toHaveCount(2);
  await expect(table.getByRole('row').nth(1)).toContainText('0.9933');

  // Reset returns to the start with the parameters unlocked.
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.getByTestId('run-status')).toHaveText(/Ready/);
  await expect(current).toHaveText('0');
  await expect(page.getByLabel(/Supply voltage V \(V\)/)).toBeEnabled();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('pause holds the simulated time; resume continues', async ({ page }) => {
  await page.goto('/resources/rl-circuit');
  await page.getByRole('combobox', { name: /Playback/ }).selectOption('10');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByTestId('run-status')).toHaveText('Paused');
  const time = page
    .getByRole('group', { name: 'Time', exact: true })
    .getByTestId('measurement-value');
  const held = await time.textContent();
  expect(Number(held)).toBeGreaterThan(0);
  await page.waitForTimeout(500);
  await expect(time).toHaveText(held ?? '');
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.getByTestId('run-status')).toHaveText('Running');
  await expect(time).not.toHaveText(held ?? '');
});

test('changing L before the run changes the time constant', async ({ page }) => {
  await page.goto('/resources/rl-circuit');
  await page.getByLabel(/Inductance L \(H\)/).fill('0.5');
  await expect(
    page.getByRole('group', { name: 'Time constant' }).getByTestId('measurement-value'),
  ).toHaveText('50');
});
