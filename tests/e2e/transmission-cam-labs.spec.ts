import { expect, test, type Page } from '@playwright/test';

/** Milestone 7: mechanical transmission and cam and follower laboratories in a real browser. */

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

test('transmission: compound train turns, belt train direction, lifting pulley (RC-M06-02 to -04)', async ({
  page,
}) => {
  test.slow();
  const errors = trackErrors(page);
  await page.goto('/modules/mechanical-transmission');
  await page.getByRole('button', { name: 'Compound train' }).click();
  await expect(reading(page, 'Output speed')).toHaveText('360');
  await page.getByRole('button', { name: 'Start' }).click();
  // The wheels turn: the drawn rotation of D changes while running.
  const wheelD = page.getByTestId('wheel-D');
  const before = await wheelD.getAttribute('transform');
  await expect.poll(async () => wheelD.getAttribute('transform')).not.toBe(before);
  await page.getByRole('button', { name: 'Record measurement' }).click();
  await expect(
    page.getByRole('table', { name: /Recorded measurements/ }).getByRole('row'),
  ).toHaveCount(2);

  await page.getByRole('button', { name: 'Stop' }).click();
  await page.getByRole('button', { name: 'Reset' }).click();
  await page.getByRole('button', { name: 'Belt train A–F' }).click();
  const rows = page.getByTestId('wheel-table').getByRole('row');
  await expect(rows.nth(6)).toContainText(/F\s*30 mm\s*33.33\s*Clockwise/);

  await page.getByRole('button', { name: 'Lifting pulleys' }).click();
  await page.getByRole('spinbutton', { name: /^Supporting rope segments/ }).fill('6');
  await expect(reading(page, 'Effort')).toHaveText('16.67');
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test('cam: displacement and velocity follow the uniform-velocity law of the course example (RC-M07-01)', async ({
  page,
}) => {
  test.slow();
  const errors = trackErrors(page);
  await page.goto('/modules/cam-and-follower');
  await page.getByRole('spinbutton', { name: /^Cam speed/ }).fill('60');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(reading(page, 'Cam angle')).not.toHaveText('0');
  await page.getByRole('button', { name: 'Pause' }).click();
  // Readings are consistent with the uniform-velocity law at whatever angle the cam stopped.
  const angle = Number(await reading(page, 'Cam angle').textContent());
  const s = Number(await reading(page, 'Follower displacement').textContent());
  const expected = angle <= 180 ? (30 * angle) / 180 : (30 * (360 - angle)) / 180;
  expect(Math.abs(s - expected)).toBeLessThan(0.05);
  await expect(reading(page, 'Follower velocity')).toHaveText(/^-?60$/);
  await page.getByRole('button', { name: 'Record measurement' }).click();
  await expect(
    page.getByRole('table', { name: /Recorded measurements/ }).getByRole('row'),
  ).toHaveCount(2);
  await expect(page.getByTestId('displacement-chart').locator('path.recharts-curve')).toHaveCount(
    1,
  );
  await noOverflow(page);
  expect(errors).toEqual([]);
});
