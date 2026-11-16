import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Milestone 11 in a real browser: the views, explorers and sensor options brought
 * in from the earlier single-file labs. Laptop and tablet sizes.
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

async function overflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

async function seriousViolations(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return result.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.help} (${v.nodes[0]?.target.join(' ')})`);
}

test('DC motor: operating-principle sequence and construction explorer', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/modules/dc-motor-drives');
  await page.getByRole('button', { name: 'Operating principle', exact: true }).click();
  const drawing = page.getByTestId('principle-drawing');
  await expect(drawing).toBeVisible();
  await expect(drawing).toHaveAttribute('data-stage', 'field-current');
  await page.getByRole('button', { name: 'Next step' }).click();
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(drawing).toHaveAttribute('data-stage', 'armature-current');
  await expect(page.getByTestId('principle-step')).toContainText('Step 3 of 8');

  // Values under the drawing come from the running model, not from the animation.
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(reading(page, 'Speed')).toHaveText('1671', { timeout: 15_000 });
  await expect(page.getByTestId('principle-live')).toContainText('N = 1670 rpm');
  await expect(page.getByTestId('principle-live')).toContainText('Ia = 20 A');
  await page.getByRole('button', { name: 'Stop', exact: true }).click();

  await page.getByRole('button', { name: 'Brushes', exact: true }).click();
  await expect(page.getByTestId('part-description')).toContainText('Carbon blocks');
  await expect(page.getByTestId('lab-shell').getByRole('region')).toHaveCount(7);
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  expect(await seriousViolations(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test('DC motor: drive waveforms, discontinuous conduction and regeneration', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/modules/dc-motor-drives');
  await page.getByRole('button', { name: 'Drive waveforms', exact: true }).click();
  const scope = page.getByTestId('drive-scope');
  await expect(scope).toBeVisible();

  // At rest (Eg = 0), full converter at 30°: 187.1 V average (RC-M01-06 voltage).
  await expect(reading(page, 'Average armature voltage')).toHaveText('187.1');
  await expect(page.getByTestId('scope-mode')).toContainText('Continuous conduction');
  await expect(page.getByTestId('scope-voltage-chart').locator('path.recharts-curve')).toHaveCount(
    2,
  );
  await expect(page.getByTestId('scope-current-chart').locator('path.recharts-curve')).toHaveCount(
    1,
  );
  await expect(page.getByTestId('conduction-strip').locator('[data-path]')).toHaveCount(2);

  // A back-emf set by hand above the average voltage: the current becomes discontinuous.
  await page.getByRole('combobox', { name: 'Back-emf Eg' }).selectOption('manual');
  await page
    .getByLabel('Back-emf Eg (negative: the load drives the motor in reverse) (V)')
    .fill('250');
  await expect(page.getByTestId('scope-mode')).toContainText('Discontinuous conduction');
  await expect(reading(page, 'Minimum armature current')).toHaveText('0');

  // Inversion with an overhauling load: regeneration in quadrant IV (RC-M01-10 voltage).
  await page
    .getByLabel('Back-emf Eg (negative: the load drives the motor in reverse) (V)')
    .fill('-220');
  await page.getByLabel('Firing angle α (α1 for a dual converter) (°)').fill('150');
  await expect(reading(page, 'Average armature voltage')).toHaveText('-187.1');
  await expect(page.getByTestId('scope-quadrant')).toContainText('Quadrant IV');
  await expect(page.getByTestId('scope-regen')).toBeVisible();

  // Dual converter with circulating current: the second trace appears.
  await page.getByRole('combobox', { name: 'Armature converter' }).selectOption('dual-circulating');
  await expect(page.getByTestId('scope-current-chart').locator('path.recharts-curve')).toHaveCount(
    2,
  );
  await expect(page.getByRole('group', { name: 'Peak circulating current' })).toBeVisible();

  await expect(page.getByTestId('lab-shell').getByRole('region')).toHaveCount(7);
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  expect(await seriousViolations(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test('stepper: hybrid step angle from rotor teeth and the construction explorer', async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto('/modules/stepper-motors');
  await page.getByRole('button', { name: 'Hybrid 1.8°', exact: true }).click();
  await expect(page.getByTestId('hybrid-note')).toBeVisible();
  await expect(page.getByLabel('Hybrid rotor teeth Nr (—)')).toHaveValue('50');
  await expect(reading(page, 'Full step angle')).toHaveText('1.8');
  await page.getByLabel('Hybrid rotor teeth Nr (—)').fill('100');
  await expect(reading(page, 'Full step angle')).toHaveText('0.9');
  await page.getByRole('button', { name: 'Stator poles and windings', exact: true }).click();
  await expect(page.getByTestId('stepper-diagram')).toHaveAttribute('data-highlight', 'poles');
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('servo: decoder chain, resolver feedback and the AC servo motor', async ({ page }) => {
  test.slow();
  const errors = trackErrors(page);
  await page.goto('/modules/servo-motors');
  await expect(page.getByTestId('sensor-chain')).toBeVisible();
  await expect(reading(page, 'Encoder resolution')).toHaveText('0.18');
  await page.getByRole('combobox', { name: 'Encoder decoding' }).selectOption('2');
  await expect(reading(page, 'Encoder resolution')).toHaveText('0.36');

  // Resolver feedback closes the loop and the servo still reaches 90°.
  await page.getByRole('combobox', { name: 'Position sensor' }).selectOption('resolver');
  await expect(page.getByTestId('chain-resolver')).toHaveAttribute('data-active', 'true');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(reading(page, 'Measured position')).toHaveText(/^(89\.\d+|90)$/, {
    timeout: 15_000,
  });
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();

  // AC two-phase servo: control phase instead of an armature current.
  await page.getByRole('combobox', { name: 'Servo motor' }).selectOption('ac');
  await expect(reading(page, 'Control phase')).toHaveText('0');
  await expect(reading(page, 'Armature current')).toHaveText('—');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(reading(page, 'Position')).toHaveText(/^(89\.\d+|90(\.\d+)?)$/, { timeout: 20_000 });
  await page.getByRole('button', { name: 'Stop', exact: true }).click();

  await expect(page.getByTestId('lab-shell').getByRole('region')).toHaveCount(7);
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  expect(await seriousViolations(page)).toEqual([]);
  expect(errors).toEqual([]);
});
