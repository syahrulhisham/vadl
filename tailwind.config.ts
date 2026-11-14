import type { Config } from 'tailwindcss';

/**
 * Design tokens (master instruction, section 6): white background, navy blue
 * primary, light blue secondary. Milestone 2 extends this into the full design
 * system; components use these token names, never raw hex values.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
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
    },
  },
  plugins: [],
} satisfies Config;
