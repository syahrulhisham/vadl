/**
 * Design tokens: the single source of colour for VADL (master instruction §6:
 * white background, navy primary, light-blue secondary). `tailwind.config.ts`
 * reads these, and `tests/unit/design-system/contrast.test.ts` checks every
 * text/background pair listed in `TEXT_PAIRS` against WCAG 2.x (NFR-04).
 *
 * This file must stay free of React and DOM imports: Tailwind loads it in Node.
 */

export const colors = {
  white: '#ffffff',
  navy: {
    50: '#eef2f9',
    100: '#d5deef',
    200: '#aabcdf',
    300: '#7f9bcf',
    400: '#4f73b6',
    500: '#2f5596',
    600: '#1f4079',
    700: '#17315f',
    800: '#102447',
    900: '#0b1a33',
  },
  lightblue: {
    50: '#f0f8ff',
    100: '#e0f0fe',
    200: '#bae0fd',
    300: '#7cc7fb',
    400: '#38aaf5',
  },
  /** Status colours, used only together with text or an icon (colour is never the only signal). */
  status: {
    warning: '#8a4b00',
    warningBg: '#fff4e5',
    danger: '#a4161a',
    dangerBg: '#fdecec',
  },
} as const;

/**
 * Every foreground/background combination used for text in the interface.
 * Adding a new combination in a component means adding it here, so the
 * contrast test covers it.
 */
export const TEXT_PAIRS: readonly {
  readonly name: string;
  readonly fg: string;
  readonly bg: string;
}[] = [
  { name: 'body text on white', fg: colors.navy[900], bg: colors.white },
  { name: 'secondary text on white', fg: colors.navy[700], bg: colors.white },
  { name: 'muted text on white', fg: colors.navy[600], bg: colors.white },
  { name: 'label text on white', fg: colors.navy[500], bg: colors.white },
  { name: 'text on light-blue panel', fg: colors.navy[700], bg: colors.lightblue[50] },
  { name: 'heading on light-blue panel', fg: colors.navy[800], bg: colors.lightblue[50] },
  { name: 'active nav item', fg: colors.navy[900], bg: colors.lightblue[100] },
  { name: 'header text', fg: colors.white, bg: colors.navy[800] },
  { name: 'header subtitle', fg: colors.lightblue[200], bg: colors.navy[800] },
  { name: 'header badge', fg: colors.lightblue[100], bg: colors.navy[800] },
  { name: 'primary button', fg: colors.white, bg: colors.navy[700] },
  { name: 'primary button hover', fg: colors.white, bg: colors.navy[800] },
  { name: 'secondary button', fg: colors.navy[800], bg: colors.lightblue[100] },
  { name: 'planned badge', fg: colors.navy[700], bg: colors.navy[50] },
  { name: 'warning text', fg: colors.status.warning, bg: colors.status.warningBg },
  { name: 'danger text', fg: colors.status.danger, bg: colors.status.dangerBg },
];
