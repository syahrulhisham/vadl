/**
 * Proves the layer rule (NFR-02) is enforced: ESLint, using the project's own
 * eslint.config.js, must reject UI or DOM dependencies inside src/sim-core and
 * must allow the same code elsewhere. The probe files never exist on disk;
 * their contents are linted as if they lived at the given paths.
 */
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint({ cwd: process.cwd() });

async function lintAt(filePath: string, code: string) {
  const [result] = await eslint.lintText(code, { filePath });
  if (!result) throw new Error('ESLint returned no result');
  return result.messages;
}

function ruleIds(messages: Awaited<ReturnType<typeof lintAt>>) {
  return messages.map((m) => m.ruleId);
}

const SIM_CORE_PROBE = 'src/sim-core/__lint_probe__.ts';
const UI_PROBE = 'src/features/__lint_probe__.ts';

describe('sim-core layer boundary', () => {
  it('fails when sim-core imports React', async () => {
    const messages = await lintAt(
      SIM_CORE_PROBE,
      "import { useState } from 'react';\nexport const probe = useState;\n",
    );
    expect(ruleIds(messages)).toContain('no-restricted-imports');
    expect(messages.find((m) => m.ruleId === 'no-restricted-imports')?.severity).toBe(2);
  });

  it('fails when sim-core imports react-dom/client', async () => {
    const messages = await lintAt(
      SIM_CORE_PROBE,
      "import { createRoot } from 'react-dom/client';\nexport const probe = createRoot;\n",
    );
    expect(ruleIds(messages)).toContain('no-restricted-imports');
  });

  it('fails when sim-core imports an upper application layer', async () => {
    const messages = await lintAt(
      SIM_CORE_PROBE,
      "import { MODULES } from '@/modules/registry';\nexport const probe = MODULES;\n",
    );
    expect(ruleIds(messages)).toContain('no-restricted-imports');
  });

  it('fails when sim-core touches a DOM global', async () => {
    const messages = await lintAt(SIM_CORE_PROBE, 'export const probe = window.innerWidth;\n');
    expect(ruleIds(messages)).toContain('no-restricted-globals');
  });

  it('allows the same React import outside sim-core', async () => {
    const messages = await lintAt(
      UI_PROBE,
      "import { useState } from 'react';\nexport const probe = useState;\n",
    );
    expect(ruleIds(messages)).not.toContain('no-restricted-imports');
  });

  it('allows sim-core to import from inside sim-core', async () => {
    const messages = await lintAt(
      SIM_CORE_PROBE,
      "import { barToPa } from './units';\nexport const probe = barToPa;\n",
    );
    expect(messages).toEqual([]);
  });
});
