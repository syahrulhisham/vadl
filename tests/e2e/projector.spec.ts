import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Classroom projector sizes: 1280 × 800 and 1024 × 768, below the laptop size
 * (1366 × 768) used by the other tests. Thresholds are those of docs/srs.md:
 * NFR-03 (no horizontal scroll, touch targets ≥ 44 px, checked in width and
 * height as the design tokens set them) and NFR-04 (measurement values ≥ 20 px;
 * contrast, below).
 *
 * Contrast: axe's colour-contrast rule applies the WCAG AA thresholds, 4.5:1 for
 * normal text and 3:1 for large text (24 px and above, or smaller bold text). The
 * measurement values are 24 px, so axe holds them to 3:1 only. The stricter NFR-04
 * requirement, 4.5:1 for every text colour including the measurement value
 * (navy-900 on white) and its unit (navy-600 on white), is verified separately by
 * the TEXT_PAIRS unit test (tests/unit/design-system/contrast.test.ts, with the
 * pairs listed in src/design-system/tokens.ts).
 *
 * Most checks are LAYOUT checks: size, position and containment. The only
 * FUNCTIONAL check is that Start and Stop operate a run; Reset and Record
 * measurement are checked for layout only (they are exercised at laptop size in
 * integration.spec.ts).
 *
 * Measurement grid (second block of tests): at 1024, 1280, 1366 and 1920 px wide,
 * every laboratory's meters sit in 2, 3, 3 and 4 columns, and long but realistic
 * readings fit inside each meter's content area (inside its border and padding).
 * The long readings are written into the page's DOM in memory only, after the live
 * values have been checked, so the check does not depend on the value the model
 * happens to show; the application and its model are not changed.
 *
 * These are automated checks in Chromium. They are not a check on a real
 * projector in the room, which is still to be done (docs/guides/lecturer-guide.md).
 * Run once, inside the laptop project: the viewport is set here.
 */

const SIZES = [
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
] as const;

const AREAS = [
  '/',
  '/overview',
  '/modules',
  '/resources',
  '/activities',
  '/assessment',
  '/progress',
  '/reports',
] as const;

const LABS: readonly (readonly [slug: string, title: string])[] = [
  ['dc-motor-drives', 'DC Motor Drives'],
  ['ac-motor-drives', 'AC Motor Drives'],
  ['power-converters', 'Power Converters'],
  ['stepper-motors', 'Stepper Motors'],
  ['servo-motors', 'Servo Motors'],
  ['mechanical-transmission', 'Mechanical Transmission'],
  ['cam-and-follower', 'Cam and Follower'],
  ['pneumatics', 'Pneumatics'],
  ['electro-pneumatics', 'Electro-Pneumatics'],
  ['electrohydraulics', 'Electrohydraulics'],
];

const TOUCH_PX = 44;
const VALUE_PX = 20;
const ONCE = 'viewport set by this file; run once, in the laptop project';

interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

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

/** Border box in page coordinates, so boxes measured at different scroll positions compare. */
async function pageBox(locator: Locator): Promise<Box> {
  return locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height };
  });
}

/**
 * Extent of the rendered text and inline content of an element, in page
 * coordinates. Unlike the element's own box, this grows when the text does not
 * fit, so comparing it with a container shows real clipping or spill-over.
 */
async function contentBox(locator: Locator): Promise<Box> {
  return locator.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const r = range.getBoundingClientRect();
    return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height };
  });
}

/** True when two boxes share area (touching edges do not count). */
function overlaps(a: Box, b: Box) {
  return (
    a.x < b.x + b.width - 0.5 &&
    b.x < a.x + a.width - 0.5 &&
    a.y < b.y + b.height - 0.5 &&
    b.y < a.y + a.height - 0.5
  );
}

/** Inner lies within outer on all four sides (half-pixel tolerance for rounding). */
function expectContained(inner: Box, outer: Box, what: string) {
  expect(inner.x, `${what}: left edge`).toBeGreaterThanOrEqual(outer.x - 0.5);
  expect(inner.y, `${what}: top edge`).toBeGreaterThanOrEqual(outer.y - 0.5);
  expect(inner.x + inner.width, `${what}: right edge`).toBeLessThanOrEqual(
    outer.x + outer.width + 0.5,
  );
  expect(inner.y + inner.height, `${what}: bottom edge`).toBeLessThanOrEqual(
    outer.y + outer.height + 0.5,
  );
}

/**
 * Visible label of an element, ignoring icons: the text nodes outside any <svg>,
 * with the extent of that text alone in page coordinates. An icon by itself gives
 * an empty label and a zero-sized extent.
 */
async function labelText(locator: Locator): Promise<{ text: string; box: Box }> {
  return locator.evaluate((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.parentElement?.closest('svg') || !node.textContent?.trim()
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT,
    });
    const nodes: Text[] = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text);
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (!first || !last) return { text: '', box: { x: 0, y: 0, width: 0, height: 0 } };
    const range = document.createRange();
    range.setStart(first, 0);
    range.setEnd(last, last.length);
    const r = range.getBoundingClientRect();
    return {
      text: nodes
        .map((n) => n.textContent ?? '')
        .join('')
        .trim(),
      box: { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height },
    };
  });
}

/** Rendered text has real size: an empty, hidden or collapsed extent is 0 × 0. */
function expectNonEmptyExtent(b: Box, what: string) {
  expect(b.width, `${what}: text width`).toBeGreaterThan(0);
  expect(b.height, `${what}: text height`).toBeGreaterThan(0);
}

function expectTouchTarget(b: Box, what: string) {
  expect(b.width, `${what}: width`).toBeGreaterThanOrEqual(TOUCH_PX);
  expect(b.height, `${what}: height`).toBeGreaterThanOrEqual(TOUCH_PX);
}

function expectInsideWidth(b: Box, width: number, what: string) {
  expect(b.x, `${what}: left edge of the window`).toBeGreaterThanOrEqual(0);
  expect(b.x + b.width, `${what}: right edge of the window`).toBeLessThanOrEqual(width + 0.5);
}

function expectNoOverlaps(boxes: readonly { name: string; box: Box }[], what: string) {
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i];
      const b = boxes[j];
      if (a && b) expect(overlaps(a.box, b.box), `${what}: ${a.name} / ${b.name}`).toBe(false);
    }
  }
}

interface Reading {
  readonly name: string;
  readonly unit: string;
  readonly valueText: string;
  readonly fontPx: number;
  /** Value and unit as rendered (text extent). */
  readonly text: Box;
  /** The meter's content area: its border box less border and padding. */
  readonly content: Box;
  /** The meter's border box. */
  readonly meter: Box;
  /** Columns of the grid that holds the meter, or null if its parent is not a grid. */
  readonly columns: number | null;
  /** The grid's identity for counting grids: the labels of the meters in it, or null. */
  readonly grid: string | null;
}

/**
 * Reads every measurement meter (MeasurementDisplay) on the page, in page order.
 * Without `samples`, one reading per meter with the value the page shows. With
 * `samples[i]`, meter i's value text is replaced in the DOM, in memory only, by each
 * string in turn and one reading is taken per string; the original text is put back.
 * Entries are null where a value has no labelled meter around it.
 */
async function readMeters(
  page: Page,
  samples?: readonly (readonly string[])[],
): Promise<(Reading | null)[]> {
  return page.evaluate((perMeter) => {
    const toPage = (r: DOMRect) => ({
      x: r.x + window.scrollX,
      y: r.y + window.scrollY,
      width: r.width,
      height: r.height,
    });
    const out: (Reading | null)[] = [];
    const values = [...document.querySelectorAll<HTMLElement>('[data-testid="measurement-value"]')];
    values.forEach((el, i) => {
      const meter = el.closest('[role="group"]');
      const row = el.parentElement;
      if (!meter || !row) {
        out.push(null);
        return;
      }
      const grid = meter.parentElement;
      const gridStyle = grid ? getComputedStyle(grid) : null;
      const isGrid = !!grid && gridStyle?.display === 'grid';
      const columns =
        isGrid && gridStyle
          ? gridStyle.gridTemplateColumns.split(' ').filter(Boolean).length
          : null;
      const gridId =
        isGrid && grid
          ? [...grid.querySelectorAll(':scope > [role="group"]')]
              .map((m) => m.getAttribute('aria-label') ?? '')
              .join(' | ')
          : null;
      const original = el.textContent ?? '';
      const strings = perMeter ? (perMeter[i] ?? []) : [original];
      for (const s of strings) {
        el.textContent = s;
        const cs = getComputedStyle(meter);
        const r = meter.getBoundingClientRect();
        const left = parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft);
        const right = parseFloat(cs.borderRightWidth) + parseFloat(cs.paddingRight);
        const top = parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop);
        const bottom = parseFloat(cs.borderBottomWidth) + parseFloat(cs.paddingBottom);
        const range = document.createRange();
        range.selectNodeContents(row);
        out.push({
          name: meter.getAttribute('aria-label') ?? 'measurement',
          unit: (el.nextElementSibling?.textContent ?? '').trim(),
          valueText: (el.textContent ?? '').trim(),
          fontPx: parseFloat(getComputedStyle(el).fontSize),
          text: toPage(range.getBoundingClientRect()),
          content: {
            x: r.x + window.scrollX + left,
            y: r.y + window.scrollY + top,
            width: r.width - left - right,
            height: r.height - top - bottom,
          },
          meter: toPage(r),
          columns,
          grid: gridId,
        });
      }
      el.textContent = original;
    });
    return out;
  }, samples);
}

/**
 * Long but physically valid test readings, chosen per meter (laboratory and label),
 * never per unit: an empty unit says nothing about the sign. formatSignificant shows
 * four significant figures, so its widest outputs are a small decimal ("0.004344")
 * and, below 0.001, an exponent ("1.235e-4").
 *
 * SIGNED: only where the laboratory's model gives the quantity a sign. DC drive: four
 * quadrants (content.en.ts "Four quadrants"). Induction motor: generating S < 0 and
 * plugging 1 < S < 2 make slip, speed, torque and powers signed. Converter: a full
 * converter inverts (Va < 0), so the average voltage and power are signed; the
 * current is not (it cannot reverse). Stepper: speed and positions follow the
 * direction (dir · speed). Servo: references reach −refMax and sine references are signed;
 * the loop signals, current, torque and resolver outputs follow them. Cam: velocity,
 * acceleration and pressure angle (atan2(ds, …)) change sign on the return. Piston
 * speeds: retraction is negative (direction · speed).
 * NON-NEGATIVE: everything else, including quantities whose sign could not be
 * established from the code (the non-negative form is always physically valid).
 * Counts are long positive integers; phases and quadrants are valid small integers;
 * form factor and hydraulic area ratio are at least 1.
 */
const SIGNED = ['-0.004344', '-1.235e-4'] as const;
const NON_NEGATIVE = ['0.004344', '1.235e-4'] as const;
const COUNT = ['88888'] as const;
const AT_LEAST_ONE = ['1.111', '12.34'] as const;
const S = SIGNED;
const N = NON_NEGATIVE;

const LONG_READINGS: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {
  'dc-motor-drives': {
    Time: N,
    Speed: S,
    'Angular speed': S,
    'Armature current': S,
    'Armature voltage': S,
    'Back-emf': S,
    'Field current': N,
    'Developed torque': S,
    'Load torque': N,
    'Input power': S,
    'Output power': S,
    Efficiency: N,
  },
  'ac-motor-drives': {
    Time: N,
    Speed: S,
    'Synchronous speed': N,
    Slip: S,
    'Rotor frequency': N,
    'Phase voltage': N,
    'Developed torque': S,
    'Load torque': N,
    'Rotor current': N,
    'Stator current': N,
    'Power factor': N,
    'Input power': S,
    'Air-gap power': S,
    'Output power': S,
    Efficiency: N,
    'Maximum torque': N,
    'Starting torque': N,
  },
  'power-converters': {
    'Average output voltage': S,
    'RMS output voltage': N,
    'Average output current': N,
    'RMS output current': N,
    'Output power': S,
    'Form factor': AT_LEAST_ONE,
    'Ripple factor': N,
    'Rectification efficiency': N,
    'Input power factor': N,
  },
  'stepper-motors': {
    Time: N,
    'Full step angle': N,
    'Angle per pulse': N,
    Phases: ['5'],
    'Pulses per revolution': COUNT,
    'Pulse rate': N,
    'Time per step': N,
    Speed: S,
    'Pulses sent': COUNT,
    'Commanded position': S,
    'Rotor position': S,
  },
  'servo-motors': {
    // Reference, Error and Steady-state error are shown in ° for the position servo and
    // in rpm for the speed servo (ServoLab.tsx). Both forms are signed: referenceRpm and
    // errorRpm in servoMotor.ts, and steadyStateError = final − last.y in servo.ts.
    Time: N,
    Reference: S,
    Position: S,
    Error: S,
    Speed: S,
    'Control signal': S,
    'Feedback signal': S,
    'Drive signal': S,
    'Amplifier output': S,
    'Armature current': S,
    'Motor torque': S,
    'Encoder count': COUNT,
    'Resolver sine output': S,
    'Resolver cosine output': S,
    'Resolver quadrant': ['4'],
    'Rise time 10–90 %': N,
    Overshoot: N,
    'Settling time (±2 %)': N,
    'Steady-state error': S,
  },
  'mechanical-transmission': {
    'Overall ratio G': N,
    'Output speed': N,
    'Output torque': N,
    'Output power': N,
    'Torque on driver pulley': N,
    'Torque on driven pulley': N,
    'Belt speed': N,
    'Power transmitted': N,
    Effort: N,
    'Mechanical advantage': N,
    'Velocity ratio': N,
    Efficiency: N,
    'Effort distance': N,
  },
  'cam-and-follower': {
    'Cam angle': N,
    'Follower displacement': N,
    'Follower velocity': S,
    'Follower acceleration': S,
    'Pressure angle': S,
    'Cam speed': N,
  },
  pneumatics: {
    'Piston position': N,
    'Piston speed': S,
    'Gauge 1Z1 (cap side)': N,
    'Theoretical force p·A': N,
    'Effective extend force': N,
    'Effective retract force': N,
    'Extend time': N,
    'Retract time': N,
  },
  'electro-pneumatics': {
    '1A1 position': N,
    '2A1 position': N,
    'Supply current': N,
    'Current through S1': N,
    'Timer elapsed': N,
  },
  electrohydraulics: {
    'Piston position (extension)': N,
    'Piston speed': S,
    'Pump pressure (gauge 0Z)': N,
    'Cap-side pressure (A)': N,
    'Rod-side pressure (B)': N,
    'Load pressure F/A_PR': N,
    'Flow to cylinder': N,
    'Flow over relief valve': N,
    'Hydraulic power p·q': N,
    'Drive power p·q/0.7': N,
    'Area ratio φ': AT_LEAST_ONE,
  },
};

/** Test readings for one meter; an unlisted meter has none, which the test reports. */
function longReadings(slug: string, label: string): readonly string[] {
  return LONG_READINGS[slug]?.[label] ?? [];
}

for (const size of SIZES) {
  const label = `${size.width} × ${size.height}`;

  test.describe(`projector size ${label}`, () => {
    test.use({ viewport: size });

    test('every area, layout: no horizontal scroll; navigation targets, header and content', async ({
      page,
    }, info) => {
      test.skip(info.project.name !== 'laptop', ONCE);
      const errors = trackErrors(page);
      for (const path of AREAS) {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        expect(await overflow(page), `${path}: horizontal scroll`).toBeLessThanOrEqual(0);

        // The navigation stays on screen at both sizes (the menu button is for < 1024 px).
        const nav = page.getByRole('navigation', { name: 'Main navigation' });
        await expect(nav).toBeVisible();
        const navBox = await pageBox(nav);
        const links = nav.getByRole('link');
        await expect(links).toHaveCount(8);
        for (const link of await links.all()) {
          // A visible text label is required; the icon alone does not count.
          const label = await labelText(link);
          const name = label.text;
          expect(name, `${path}: navigation link has a text label`).not.toBe('');
          expectNonEmptyExtent(label.box, `${path}: label "${name}"`);
          const linkBox = await pageBox(link);
          expectTouchTarget(linkBox, `${path}: link "${name}"`);
          expectInsideWidth(linkBox, size.width, `${path}: link "${name}"`);
          // The link spans the navigation column, so its box is set by the column, not by
          // its text: text that does not fit shows up outside the link or the column.
          expectContained(linkBox, navBox, `${path}: link "${name}" in the navigation`);
          expectContained(await contentBox(link), linkBox, `${path}: text of "${name}"`);
        }
        expect(
          overlaps(navBox, await pageBox(page.locator('#main'))),
          `${path}: navigation overlaps the content`,
        ).toBe(false);

        const title = page.getByRole('banner').getByRole('link').first();
        const badge = page.getByTestId('designer-badge');
        const badgeBox = await pageBox(badge);
        expectInsideWidth(badgeBox, size.width, `${path}: designer badge`);
        expect(
          overlaps(await pageBox(title), badgeBox),
          `${path}: header title overlaps the badge`,
        ).toBe(false);
      }
      expect(errors).toEqual([]);
    });

    for (const [slug, title] of LABS) {
      test(`${title}: layout of run controls and readouts; Start and Stop operate; contrast`, async ({
        page,
      }, info) => {
        test.skip(info.project.name !== 'laptop', ONCE);
        test.slow();
        const errors = trackErrors(page);
        await page.goto(`/modules/${slug}`);
        await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
        const regions = page.getByTestId('lab-shell').getByRole('region');
        await expect(regions).toHaveCount(7);
        expect(await overflow(page), 'horizontal scroll').toBeLessThanOrEqual(0);

        // LAYOUT of the run controls and recording button (NFR-03): visible, inside the
        // window and inside the laboratory region that holds them, at least 44 × 44 px,
        // not overlapping one another. Stop and Reset are disabled before a run; their
        // layout is the same either way.
        const controls = [
          { name: 'Start', button: page.getByRole('button', { name: 'Start', exact: true }) },
          { name: 'Stop', button: page.getByRole('button', { name: 'Stop', exact: true }) },
          { name: 'Reset', button: page.getByRole('button', { name: 'Reset', exact: true }) },
          {
            name: 'Record measurement',
            button: page.getByRole('button', { name: 'Record measurement' }),
          },
        ];
        const controlBoxes: { name: string; box: Box }[] = [];
        for (const { name, button } of controls) {
          await button.scrollIntoViewIfNeeded();
          await expect(button).toBeVisible();
          const b = await pageBox(button);
          expectTouchTarget(b, `button "${name}"`);
          expectInsideWidth(b, size.width, `button "${name}"`);
          const region = regions.filter({ has: button });
          await expect(region, `one region holds "${name}"`).toHaveCount(1);
          expectContained(b, await pageBox(region), `button "${name}" in its region`);
          controlBoxes.push({ name, box: b });
        }
        expectNoOverlaps(controlBoxes, 'run controls overlap');

        // FUNCTION: Start and Stop operate a run at this size. (Reset and Record
        // measurement are not operated here.)
        await controls[0]?.button.click();
        await expect(page.getByTestId('run-status')).toHaveText('Running');
        await controls[1]?.button.click();
        await expect(page.getByTestId('run-status')).not.toHaveText('Running');

        // LAYOUT of the measurement readouts (NFR-04), with the values the model shows
        // after the run: each value at least 20 px; the whole reading (value and unit)
        // inside the meter's content area, within its border and padding; meters do not
        // overlap. The meter is the readout's own labelled group (MeasurementDisplay). The
        // measurement-grid tests below repeat the fit check with fixed long readings.
        const readings = await readMeters(page);
        expect(readings.length, 'measurement values shown').toBeGreaterThan(0);
        const meterBoxes: { name: string; box: Box }[] = [];
        for (const reading of readings) {
          expect(reading, 'a value sits in a labelled meter').not.toBeNull();
          if (!reading) continue;
          // A value is always shown: a number, or "—" before the model has produced one.
          // The unit may be empty (dimensionless quantities use unit="").
          expect(reading.valueText, `${reading.name}: value text`).not.toBe('');
          expectNonEmptyExtent(reading.text, `${reading.name}: value and unit`);
          expect(reading.fontPx, `${reading.name}: value font size`).toBeGreaterThanOrEqual(
            VALUE_PX,
          );
          expectContained(
            reading.text,
            reading.content,
            `${reading.name}: "${reading.valueText} ${reading.unit}" in the meter's content area`,
          );
          expectInsideWidth(reading.meter, size.width, `${reading.name}: meter`);
          meterBoxes.push({ name: reading.name, box: reading.meter });
        }
        expectNoOverlaps(meterBoxes, 'measurement meters overlap');

        // Contrast at this size, after the run, by axe's WCAG AA rule: 4.5:1 for normal
        // text, 3:1 for large text such as the 24 px values. NFR-04's 4.5:1 for the value
        // and unit colours is enforced by the TEXT_PAIRS unit test (see the header).
        const contrast = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
        const failures = contrast.violations.flatMap((v) =>
          v.nodes.map((n) => `${n.target.join(' ')}: ${n.failureSummary ?? ''}`),
        );
        expect(failures, failures.join('\n')).toEqual([]);

        expect(await overflow(page), 'horizontal scroll after running').toBeLessThanOrEqual(0);
        expect(errors).toEqual([]);
      });
    }
  });
}

/**
 * Measurement grid: the 13 meter grids of the ten laboratories (2 columns from 640 px,
 * 3 from 1280 px, 4 from 1536 px) at four window sizes, with fixed long readings.
 * Grids that are not on the page when a laboratory opens are reached through the
 * laboratory's own controls, as a student would: Transmission's "Belt tensions" and
 * "Lifting pulleys" views, and Servo's step-response measurements, which appear once a
 * step run has started (the default reference is a step) and stay after Stop.
 */
const GRID_SIZES = [
  { width: 1024, height: 768, columns: 2 },
  { width: 1280, height: 800, columns: 3 },
  { width: 1366, height: 768, columns: 3 },
  { width: 1920, height: 1080, columns: 4 },
] as const;

/** Meter grids per laboratory (13 in all); the test fails if it reaches fewer or more. */
const GRIDS_PER_LAB: Readonly<Record<string, number>> = {
  'dc-motor-drives': 1,
  'ac-motor-drives': 1,
  'power-converters': 1,
  'stepper-motors': 1,
  'servo-motors': 2,
  'mechanical-transmission': 3,
  'cam-and-follower': 1,
  pneumatics: 1,
  'electro-pneumatics': 1,
  electrohydraulics: 1,
};

/**
 * One state of a laboratory's page: every meter must sit in a grid with the expected
 * columns, have test readings listed for it, and fit its content area with each of
 * them. Returns the identities of the grids measured.
 */
async function checkMeterGrids(
  page: Page,
  slug: string,
  width: number,
  columns: number,
  state: string,
): Promise<string[]> {
  const live = await readMeters(page);
  expect(live.length, `${state}: measurement values shown`).toBeGreaterThan(0);
  const grids = new Set<string>();
  for (const reading of live) {
    expect(reading, `${state}: a value sits in a labelled meter`).not.toBeNull();
    if (!reading) continue;
    expect(reading.grid, `${state}: ${reading.name} sits in a grid`).not.toBeNull();
    if (reading.grid === null) continue;
    grids.add(reading.grid);
    expect(reading.columns, `${state}: ${reading.name}: meter grid columns`).toBe(columns);
    expect(
      longReadings(slug, reading.name).length,
      `${state}: test readings listed for "${reading.name}"`,
    ).toBeGreaterThan(0);
  }

  // DETERMINISTIC fit check: each meter with its long, physically valid test readings
  // (written into the page in memory only; the original text is put back).
  const samples = live.map((r) => (r ? longReadings(slug, r.name) : []));
  const long = await readMeters(page, samples);
  expect(long.length, `${state}: one reading per sample`).toBe(
    samples.reduce((n, s) => n + s.length, 0),
  );
  for (const reading of long) {
    if (!reading) continue;
    const what = `${state}: ${reading.name}: "${reading.valueText} ${reading.unit}"`;
    expect(reading.fontPx, `${what}: value font size`).toBeGreaterThanOrEqual(VALUE_PX);
    expectNonEmptyExtent(reading.text, what);
    expectContained(reading.text, reading.content, `${what} in the meter's content area`);
    expectInsideWidth(reading.meter, width, `${what}: meter`);
  }
  expect(await overflow(page), `${state}: horizontal scroll`).toBeLessThanOrEqual(0);
  return [...grids];
}

for (const { width, height, columns } of GRID_SIZES) {
  test.describe(`measurement grid at ${width} × ${height}`, () => {
    test.use({ viewport: { width, height } });

    for (const [slug, title] of LABS) {
      test(`${title}: ${columns} meter columns; long readings fit the content area; touch targets`, async ({
        page,
      }, info) => {
        test.skip(info.project.name !== 'laptop', ONCE);
        const errors = trackErrors(page);
        await page.goto(`/modules/${slug}`);
        await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
        await expect(page.getByTestId('lab-shell').getByRole('region')).toHaveCount(7);
        expect(await overflow(page), 'horizontal scroll').toBeLessThanOrEqual(0);

        const grids = new Set(await checkMeterGrids(page, slug, width, columns, 'on opening'));

        // Touch targets of the run controls at this width (NFR-03), 44 × 44 px.
        for (const name of ['Start', 'Stop', 'Reset', 'Record measurement']) {
          const button = page.getByRole('button', { name, exact: true });
          await expect(button, `button "${name}"`).toBeVisible();
          const b = await pageBox(button);
          expectTouchTarget(b, `button "${name}"`);
          expectInsideWidth(b, width, `button "${name}"`);
        }

        // Grids that appear only after a student action, reached through the real UI.
        if (slug === 'mechanical-transmission') {
          for (const view of ['Belt tensions', 'Lifting pulleys']) {
            const button = page.getByRole('button', { name: view, exact: true });
            await button.click();
            await expect(button).toHaveAttribute('aria-pressed', 'true');
            for (const g of await checkMeterGrids(page, slug, width, columns, `view "${view}"`)) {
              grids.add(g);
            }
          }
        }
        if (slug === 'servo-motors') {
          const metrics = page.getByRole('region', {
            name: 'Step-response measurements (extension)',
          });
          await expect(metrics).toHaveCount(0);
          await page.getByRole('button', { name: 'Start', exact: true }).click();
          await expect(page.getByTestId('run-status')).toHaveText('Running');
          await expect(metrics).toBeVisible();
          await page.getByRole('button', { name: 'Stop', exact: true }).click();
          await expect(page.getByTestId('run-status')).not.toHaveText('Running');
          await expect(metrics).toBeVisible();
          for (const g of await checkMeterGrids(page, slug, width, columns, 'after a step run')) {
            grids.add(g);
          }

          // Speed servo, through the "Servo type" selector. It is locked unless the
          // laboratory is idle, so the run is reset first. Speed mode replaces Reference,
          // Position and Error (°) with Reference and Error (rpm) in the main grid; after a
          // step run its metrics show Steady-state error in rpm. The same two grids are
          // checked again with the same checks; they are not counted again above.
          await page.getByRole('button', { name: 'Reset', exact: true }).click();
          const mode = page.getByRole('combobox', { name: 'Servo type' });
          await expect(mode).toBeEnabled();
          await mode.selectOption({ label: 'Speed servo' });
          await expect(mode).toHaveValue('speed');
          await expect(page.getByRole('group', { name: 'Position', exact: true })).toHaveCount(0);
          await expect(metrics).toHaveCount(0);
          const meterIn = (readings: readonly (Reading | null)[], name: string) =>
            readings.find((r) => r?.name === name) ?? null;

          const speedMode = await readMeters(page);
          const time = meterIn(speedMode, 'Time');
          expect(time?.grid, 'speed mode: main grid (holding "Time") found').toBeTruthy();
          for (const name of ['Reference', 'Error']) {
            const meter = meterIn(speedMode, name);
            expect(meter, `speed mode: "${name}" shown`).not.toBeNull();
            expect(meter?.unit, `speed mode: "${name}" unit`).toBe('rpm');
            expect(meter?.grid, `speed mode: "${name}" in the main grid`).toBe(time?.grid);
          }
          const speedGrids = new Set(
            await checkMeterGrids(page, slug, width, columns, 'speed mode'),
          );

          await page.getByRole('button', { name: 'Start', exact: true }).click();
          await expect(page.getByTestId('run-status')).toHaveText('Running');
          await expect(metrics).toBeVisible();
          await page.getByRole('button', { name: 'Stop', exact: true }).click();
          await expect(page.getByTestId('run-status')).not.toHaveText('Running');
          await expect(metrics).toBeVisible();
          const speedRun = await readMeters(page);
          const riseTime = meterIn(speedRun, 'Rise time 10–90 %');
          expect(
            riseTime?.grid,
            'speed mode: metrics grid (holding "Rise time") found',
          ).toBeTruthy();
          const sse = meterIn(speedRun, 'Steady-state error');
          expect(sse, 'speed mode: "Steady-state error" shown').not.toBeNull();
          expect(sse?.unit, 'speed mode: "Steady-state error" unit').toBe('rpm');
          expect(sse?.grid, 'speed mode: "Steady-state error" in the metrics grid').toBe(
            riseTime?.grid,
          );
          for (const g of await checkMeterGrids(
            page,
            slug,
            width,
            columns,
            'speed mode after a step run',
          )) {
            speedGrids.add(g);
          }
          expect(speedGrids.size, 'speed mode: main and metrics grids measured').toBe(2);
        }
        expect(grids.size, 'meter grids measured in this laboratory').toBe(GRIDS_PER_LAB[slug]);
        expect(errors).toEqual([]);
      });
    }
  });
}
