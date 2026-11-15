import { expect, test, type Page } from '@playwright/test';

/** Milestone 8: pneumatics, electro-pneumatics and electrohydraulics laboratories in a real browser. */

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

test('pneumatics: AND with memory — extends on 1S1 at the begin position, holds, 1S2 returns', async ({
  page,
}) => {
  test.slow();
  const errors = trackErrors(page);
  await page.goto('/modules/pneumatics');
  await page.getByRole('combobox', { name: 'Lab 2 circuit' }).selectOption('and-memory');
  await page.getByRole('button', { name: 'Start' }).click();
  const s1 = page.getByRole('button', { name: '1S1' });
  await s1.dispatchEvent('pointerdown');
  await s1.dispatchEvent('pointerup');
  await expect(reading(page, 'Piston position')).toHaveText('100', { timeout: 10_000 });
  await expect(reading(page, 'Gauge 1Z1 (cap side)')).toHaveText('3.5');
  const s2 = page.getByRole('button', { name: '1S2' });
  await s2.dispatchEvent('pointerdown');
  await s2.dispatchEvent('pointerup');
  await expect(reading(page, 'Piston position')).toHaveText('0', { timeout: 10_000 });
  await page.getByRole('button', { name: 'Record measurement' }).click();
  await expect(
    page.getByRole('table', { name: /Recorded measurements/ }).getByRole('row'),
  ).toHaveCount(2);
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test('electro-pneumatics: Part D runs the sequence 1A1+ 2A1+ 1A1− 2A1− (RC-M09-02)', async ({
  page,
}) => {
  test.slow();
  const errors = trackErrors(page);
  await page.goto('/modules/electro-pneumatics');
  await page.getByRole('button', { name: 'Part D: sequence' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  const s1 = page.getByRole('button', { name: 'S1' });
  await s1.dispatchEvent('pointerdown');
  await expect(reading(page, '2A1 position')).toHaveText('100', { timeout: 10_000 });
  await expect(reading(page, '1A1 position')).toHaveText('100');
  await s1.dispatchEvent('pointerup');
  await expect(reading(page, '1A1 position')).toHaveText('0', { timeout: 10_000 });
  await expect(reading(page, '2A1 position')).toHaveText('0', { timeout: 10_000 });
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test('electrohydraulics: Lab 4a Ex 2 lowers by the weight, raises with the pump to the relief at the end', async ({
  page,
}) => {
  test.slow();
  const errors = trackErrors(page);
  await page.goto('/modules/electrohydraulics');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(reading(page, 'Piston position (extension)')).toHaveText('200', { timeout: 10_000 });
  await page.getByRole('button', { name: /^Pump:/ }).click();
  await page.getByRole('button', { name: /^Hand lever:/ }).click();
  await expect(reading(page, 'Piston position (extension)')).toHaveText('0', { timeout: 10_000 });
  await expect(reading(page, 'Pump pressure (gauge 0Z)')).toHaveText('5');
  await expect(reading(page, 'Flow over relief valve')).toHaveText('2');
  await noOverflow(page);
  expect(errors).toEqual([]);
});
