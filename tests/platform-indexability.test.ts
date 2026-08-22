import { describe, it, expect } from 'vitest';
import { PLATFORM_INDEX_MIN, isPlatformIndexable } from '../src/config/discovery';

describe('Platform Indexability Dynamic Threshold', () => {
  it('defines PLATFORM_INDEX_MIN as 5', () => {
    expect(PLATFORM_INDEX_MIN).toBe(5);
  });

  it('marks 0 qualified communities as non-indexable (noindex & sitemap excluded)', () => {
    expect(isPlatformIndexable(0)).toBe(false);
  });

  it('marks 4 qualified communities as non-indexable (below threshold)', () => {
    expect(isPlatformIndexable(4)).toBe(false);
  });

  it('marks 5 qualified communities as indexable (meets threshold)', () => {
    expect(isPlatformIndexable(5)).toBe(true);
  });

  it('marks greater than 5 qualified communities as indexable', () => {
    expect(isPlatformIndexable(10)).toBe(true);
    expect(isPlatformIndexable(145)).toBe(true);
  });

  it('supports custom threshold override', () => {
    expect(isPlatformIndexable(3, 3)).toBe(true);
    expect(isPlatformIndexable(2, 3)).toBe(false);
  });
});
