import type { Config } from 'tailwindcss';
import { colors } from './src/design-system/tokens';

/**
 * Tailwind reads its colours from src/design-system/tokens.ts, the single source
 * of truth that the contrast tests also check. Components use these token names
 * (navy-*, lightblue-*, status-*), never raw hex values.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: colors.navy,
        lightblue: colors.lightblue,
        status: colors.status,
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
} satisfies Config;
