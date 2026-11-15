import { expect, test, type Page } from '@playwright/test';

/** Milestone 6: stepper motor and servo motor laboratories in a real browser. */

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

async function noOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test('stepper: six wave steps of the 6/4 VR motor reach 180°, both directions (RC-M04-03)', async ({
  page,
}) => {
  test.slow(); // two runs on a chart-heavy page
  const errors = trackErrors(page);
  await page.goto('/modules/stepper-motors');
  await page.getByRole('spinbutton', { name: /^Number of pulses/ }).fill('6');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(reading(page, 'Pulses sent')).toHaveText('6', { timeout: 10_000 });
  await expect(reading(page, 'Rotor position')).toHaveText('180');
  await expect(reading(page, 'Speed')).toHaveText('0'); // pulses finished
  await expect(page.getByTestId('phase-lights')).toContainText('A on');
  await page.getByRole('button', { name: 'Record measurement' }).click();
  await expect(
    page.getByRole('table', { name: /Recorded measurements/ }).getByRole('row'),
  ).toHaveCount(2);

  await page.getByRole('button', { name: 'Stop' }).click();
  await page.getByRole('button', { name: 'Reset' }).click();
  await page.getByRole('button', { name: 'Anticlockwise' }).click();
  await page.getByRole('combobox', { name: 'Drive mode' }).selectOption('half');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(reading(page, 'Pulses sent')).toHaveText('6', { timeout: 10_000 });
  await expect(reading(page, 'Rotor position')).toHaveText('-90');
  await expect(page.getByTestId('timing-diagram').locator('[data-testid^="timing-i"]')).toHaveCount(
    3,
  );
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test('stepper: the sequence-table question marks a filled table', async ({ page }) => {
  await page.goto('/modules/stepper-motors');
  const card = page.locator('[data-question-id="m04.seq.vr"]');
  await expect(card).toBeVisible();
  // Fill nothing but angles: the phase pattern is wrong, so feedback names steps.
  const angles = card.getByRole('textbox', { name: /rotor angle in degrees/ });
  const n = await angles.count();
  for (let i = 0; i < n; i += 1) await angles.nth(i).fill('0');
  await card.getByRole('button', { name: 'Check answer' }).click();
  await expect(card.getByRole('status')).toContainText('Not correct');
  await expect(card.getByRole('status')).toContainText('Step 1:');
});

test('servo: position step settles at 90°; speed servo reaches 866.5 rpm (RC-M05-04)', async ({
  page,
}) => {
  test.slow();
  const errors = trackErrors(page);
  await page.goto('/modules/servo-motors');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(reading(page, 'Position')).toHaveText('90', { timeout: 10_000 });
  // Settled: residue below 1e−9 is shown as exactly 0 (cleanResidue).
  await expect(reading(page, 'Drive signal')).toHaveText('0');
  await expect(reading(page, 'Encoder count')).toHaveText(/^(499|500)$/);
  await expect(reading(page, 'Overshoot')).toHaveText(/^1[56]\.\d+$/);
  await page.getByRole('button', { name: 'Record measurement' }).click();
  await expect(
    page.getByRole('table', { name: /Recorded measurements/ }).getByRole('row'),
  ).toHaveCount(2);

  await page.getByRole('button', { name: 'Stop' }).click();
  await page.getByRole('button', { name: 'Reset' }).click();
  await page.getByRole('button', { name: 'Speed 100 rad/s' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(reading(page, 'Speed')).toHaveText('866.5', { timeout: 10_000 });
  await expect(page.getByTestId('response-chart').locator('path.recharts-curve')).toHaveCount(2);
  await noOverflow(page);
  expect(errors).toEqual([]);
});
