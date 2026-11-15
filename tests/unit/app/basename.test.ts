import { describe, expect, it } from 'vitest';
import { basenameFrom } from '@/app/basename';

describe('basenameFrom', () => {
  it('serves from the site root by default', () => {
    expect(basenameFrom('/')).toBe('');
  });
  it('drops the trailing slash of a sub-folder base', () => {
    expect(basenameFrom('/vadl/')).toBe('/vadl');
    expect(basenameFrom('/courses/belk3423/vadl/')).toBe('/courses/belk3423/vadl');
  });
  it('treats a relative base as the root', () => {
    expect(basenameFrom('./')).toBe('');
  });
});
