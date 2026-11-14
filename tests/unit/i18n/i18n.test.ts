import { describe, expect, it } from 'vitest';
import { t } from '@/i18n';

describe('t()', () => {
  it('returns English text for a known key', () => {
    expect(t('app.shortName')).toBe('VADL');
  });

  it('substitutes placeholders', () => {
    expect(t('module.number', { n: 7 })).toBe('Module 7');
  });

  it('leaves an unmatched placeholder visible', () => {
    expect(t('module.number')).toBe('Module {n}');
  });

  it('returns the key itself when the text is missing, so the gap is visible', () => {
    expect(t('no.such.key')).toBe('no.such.key');
  });
});
