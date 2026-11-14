import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Layer rule (NFR-02, docs/architecture.md): the simulation core must not
 * depend on React, the DOM or any application layer above it. It is enforced
 * by path below and proven by tests/unit/lint/sim-core-boundary.test.ts.
 */
const UPPER_LAYERS = ['app', 'design-system', 'features', 'modules', 'hooks', 'storage', 'i18n'];

const SIM_CORE_FORBIDDEN_IMPORTS = {
  paths: [
    { name: 'react', message: 'sim-core must not import React (layer rule, NFR-02).' },
    { name: 'react-dom', message: 'sim-core must not import React DOM (layer rule, NFR-02).' },
  ],
  patterns: [
    {
      group: ['react/*', 'react-dom/*', 'react-router*', 'recharts', 'recharts/*', 'three'],
      message: 'sim-core must not import UI or rendering libraries (layer rule, NFR-02).',
    },
    {
      group: UPPER_LAYERS.flatMap((layer) => [`@/${layer}`, `@/${layer}/*`, `**/${layer}/*`]),
      message: 'sim-core depends on nothing above it (layer rule, NFR-02).',
    },
  ],
};

const SIM_CORE_FORBIDDEN_GLOBALS = [
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'requestAnimationFrame',
  'HTMLElement',
].map((name) => ({
  name,
  message: `sim-core must not use the DOM global "${name}" (layer rule, NFR-02).`,
}));

export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'test-results', 'playwright-report', 'node_modules'],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
  {
    files: ['src/sim-core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', SIM_CORE_FORBIDDEN_IMPORTS],
      'no-restricted-globals': ['error', ...SIM_CORE_FORBIDDEN_GLOBALS],
    },
  },
  {
    files: ['*.config.{ts,js}', 'tests/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  prettier,
);
