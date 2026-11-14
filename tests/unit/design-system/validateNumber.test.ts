import { describe, expect, it } from 'vitest';
import { validateNumber } from '@/design-system';

describe('validateNumber (FR-05)', () => {
  it('accepts values inside the range, including the limits', () => {
    expect(validateNumber('220', 0, 250, 'V')).toEqual({ ok: true, value: 220 });
    expect(validateNumber('0', 0, 250, 'V')).toEqual({ ok: true, value: 0 });
    expect(validateNumber(' 250 ', 0, 250, 'V')).toEqual({ ok: true, value: 250 });
    expect(validateNumber('1e2', 0, 250, 'V')).toEqual({ ok: true, value: 100 });
  });

  it('rejects empty and non-numeric input', () => {
    expect(validateNumber('', 0, 250, 'V')).toEqual({ ok: false, message: 'Enter a value.' });
    expect(validateNumber('abc', 0, 250, 'V')).toEqual({ ok: false, message: 'Enter a number.' });
    expect(validateNumber('Infinity', 0, 250, 'V')).toEqual({
      ok: false,
      message: 'Enter a number.',
    });
  });

  it('rejects out-of-range values with the range and unit', () => {
    expect(validateNumber('300', 0, 250, 'V')).toEqual({
      ok: false,
      message: 'Enter a value from 0 to 250 V.',
    });
    expect(validateNumber('-1', 0, 250, 'V')).toMatchObject({ ok: false });
  });

  it('uses the engineering explanation when one is given', () => {
    const explain = (v: number) => `${v} V exceeds the 250 V armature rating.`;
    expect(validateNumber('300', 0, 250, 'V', explain)).toEqual({
      ok: false,
      message: '300 V exceeds the 250 V armature rating.',
    });
  });
});
