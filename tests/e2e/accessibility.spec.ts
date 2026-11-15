import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * NFR-10 accessibility audit with axe-core (WCAG 2.1 A and AA rules) on every
 * page. Serious and critical violations fail the test. Chromium at laptop size
 * only: the rules do not depend on the browser.
 */

const PAGES = [
  '/',
  '/overview',
  '/modules',
  '/resources',
  '/resources/rl-circuit',
  '/activities',
  '/assessment',
  '/progress',
  '/reports',
  '/reports/m01-dc-motor',
  '/modules/dc-motor-drives',
  '/modules/ac-motor-drives',
  '/modules/power-converters',
  '/modules/stepper-motors',
  '/modules/servo-motors',
  '/modules/mechanical-transmission',
  '/modules/cam-and-follower',
  '/modules/pneumatics',
  '/modules/electro-pneumatics',
  '/modules/electrohydraulics',
];

for (const path of PAGES) {
  test(`no serious or critical accessibility violations: ${path}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'laptop', 'audited once, at laptop size');
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForLoadState('networkidle');
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const serious = result.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map(
        (v) =>
          `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`,
      );
    expect(serious, serious.join('\n')).toEqual([]);
  });
}
