import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Node by default; component tests opt in with `// @vitest-environment jsdom`.
      environment: 'node',
      include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/reference/**/*.test.ts'],
      setupFiles: ['tests/setup.ts'],
      restoreMocks: true,
      // The lint-boundary test starts ESLint, which is slow on a cold cache.
      testTimeout: 30_000,
      // Each jsdom app test renders whole laboratory pages with their charts. More than
      // about four parallel workers starve each other (worse under coverage) and lazy
      // page loads time out: seen with six workers in Milestone 9 (11 failures, 404 s),
      // while four workers passed every test in about 60 s on the same machine.
      maxWorkers: 4,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'json-summary'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/main.tsx', 'src/**/index.ts', 'src/**/types.ts', 'src/**/*.d.ts'],
        thresholds: {
          // Quality gate from the project plan, section 7: simulation core >= 90 % of lines.
          'src/sim-core/**': { lines: 90, functions: 90, statements: 90, branches: 85 },
        },
      },
    },
  }),
);
