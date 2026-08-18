import { describe, it, expect } from 'vitest';
import { slugifyTag, assertTagSlugsUnique, categories } from '../src/config/categories';

describe('slugifyTag', () => {
  it('produces stable lowercase slugs', () => {
    expect(slugifyTag('Artificial Intelligence')).toBe('artificial-intelligence');
    expect(slugifyTag('AI & Tech')).toBe('ai-and-tech');
    expect(slugifyTag('XAUUSD')).toBe('xauusd');
  });
});

describe('category config integrity', () => {
  it('has unique category slugs', () => {
    const slugs = categories.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has globally unique tag slugs (assertTagSlugsUnique passes)', () => {
    expect(() => assertTagSlugsUnique()).not.toThrow();
  });

  it('marks financial categories correctly', () => {
    const financial = categories.filter((c) => c.financialDisclaimerRequired).map((c) => c.slug);
    expect(financial).toContain('crypto-web3');
    expect(financial).toContain('forex-stocks');
    expect(financial).toContain('online-earning');
    expect(financial).not.toContain('ai-tech');
  });
});
