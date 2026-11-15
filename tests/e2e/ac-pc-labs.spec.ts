import { expect, test, type Page } from '@playwright/test';

/** Milestone 5: AC motor and power converter laboratories in a real browser. */

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

test('AC motor reaches RC-M02-01 and stator-voltage control slows the fan to 1550 rpm', async ({
  page,
}) => {
  test.slow(); // two runs or many steps on chart-heavy pages; slow when all workers share the CPU
  const errors = trackErrors(page);
  await page.goto('/modules/ac-motor-drives');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(reading(page, 'Speed')).toHaveText('1750', { timeout: 10_000 });
  await expect(reading(page, 'Slip')).toHaveText('2.778');
  await expect(reading(page, 'Developed torque')).toHaveText('118.6');
  await expect(reading(page, 'Power factor')).toHaveText('0.8582');
  await expect(reading(page, 'Efficiency')).toHaveText('92.27');
  await page.getByRole('button', { name: 'Record measurement' }).click();
  await expect(
    page.getByRole('table', { name: /Recorded measurements/ }).getByRole('row'),
  ).toHaveCount(2);

  await page.getByRole('button', { name: 'Stop' }).click();
  await page.getByRole('button', { name: 'Reset' }).click();
  await page.getByRole('button', { name: 'Stator voltage', exact: true }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(reading(page, 'Speed')).toHaveText('1550', { timeout: 10_000 });

  await expect(page.getByTestId('characteristic-chart').locator('path.recharts-curve')).toHaveCount(
    2,
  );
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('power converters: Lab 1 tables, buck converter and PWM inverter', async ({ page }) => {
  test.slow(); // two runs or many steps on chart-heavy pages; slow when all workers share the CPU
  const errors = trackErrors(page);
  await page.goto('/modules/power-converters');
  await page.getByRole('button', { name: 'Start' }).click();

  // Lab 1 Table 3: half-wave thyristor, 240 V, α 0° … 180°.
  const expected: [string, string][] = [
    ['0°', '108'],
    ['60°', '81.03'],
    ['120°', '27.01'],
    ['180°', '0'],
  ];
  for (const [alpha, vavg] of expected) {
    await page.getByRole('button', { name: alpha, exact: true }).click();
    await expect(reading(page, 'Average output voltage')).toHaveText(vavg);
    await page.getByRole('button', { name: 'Record measurement' }).click();
  }
  await expect(
    page.getByRole('table', { name: /Recorded measurements/ }).getByRole('row'),
  ).toHaveCount(5);
  await expect(
    page.getByTestId('scope-chart').locator('path.recharts-curve').first(),
  ).toBeVisible();

  await page.getByRole('combobox', { name: 'Converter type' }).selectOption('dcdc');
  await expect(reading(page, 'Average output voltage')).toHaveText('19.2');
  await expect(reading(page, 'Inductor ripple ΔI')).toHaveText('0.576');

  await page.getByRole('combobox', { name: 'Converter type' }).selectOption('inverter');
  await expect(reading(page, 'Fundamental, formula')).toHaveText('113.1');

  // The report graphs Vavg against α from the recorded rows.
  await page.getByRole('link', { name: 'Open laboratory report' }).click();
  await expect(page.getByTestId('report-graph')).toBeVisible();
  await expect(page.getByText('Drawn from your 4 recorded rows only.')).toBeVisible();
  expect(errors).toEqual([]);
});
