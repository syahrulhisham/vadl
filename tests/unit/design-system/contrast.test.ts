import { describe, expect, it } from 'vitest';
import { colors, contrastRatio, parseHex, relativeLuminance, TEXT_PAIRS } from '@/design-system';
import tailwindConfig from '../../../tailwind.config';

describe('contrast utilities (WCAG 2.x)', () => {
  it('gives 21:1 for black on white and 1:1 for identical colours', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 10);
    expect(contrastRatio('#2f5596', '#2f5596')).toBeCloseTo(1, 10);
  });

  it('matches the published value for #767676 on white (4.54:1, the WCAG AA reference grey)', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#102447', '#bae0fd')).toBeCloseTo(
      contrastRatio('#bae0fd', '#102447'),
      12,
    );
  });

  it('computes relative luminance of white as 1 and black as 0', () => {
    expect(relativeLuminance('#fff')).toBeCloseTo(1, 12);
    expect(relativeLuminance('#000')).toBe(0);
  });

  it('parses short and long hex, and rejects anything else', () => {
    expect(parseHex('#abc')).toEqual([0xaa, 0xbb, 0xcc]);
    expect(parseHex('#102447')).toEqual([0x10, 0x24, 0x47]);
    expect(() => parseHex('navy')).toThrow(/Not a hex colour/);
  });
});

describe('design tokens (NFR-04)', () => {
  it.each(TEXT_PAIRS)('$name has contrast of at least 4.5:1', ({ fg, bg }) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('Tailwind uses exactly the token colours, so the tested colours are the rendered colours', () => {
    const extend = tailwindConfig.theme?.extend as { colors: Record<string, unknown> };
    expect(extend.colors.navy).toBe(colors.navy);
    expect(extend.colors.lightblue).toBe(colors.lightblue);
    expect(extend.colors.status).toBe(colors.status);
  });
});
