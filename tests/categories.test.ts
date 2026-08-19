import { describe, it, expect } from 'vitest';
import { slugifyTag, assertTagSlugsUnique, categories } from '../src/config/categories';
import { examFamilies } from '../src/config/examFamilies';

/** The 13 study-scout exam families that now define the category taxonomy. */
const STUDY_FAMILY_SLUGS = [
  'college-admissions',
  'graduate-admissions',
  'english-proficiency',
  'medical-healthcare',
  'law',
  'finance-accounting',
  'technology-certifications',
  'cybersecurity-certifications',
  'cloud-certifications',
  'networking-certifications',
  'project-management',
  'professional-licensing',
  'general-study',
];

describe('slugifyTag', () => {
  it('produces stable lowercase slugs', () => {
    expect(slugifyTag('Artificial Intelligence')).toBe('artificial-intelligence');
    expect(slugifyTag('CompTIA Security+')).toBe('comptia-security');
    expect(slugifyTag('AI & Tech')).toBe('ai-and-tech');
    expect(slugifyTag('SY0-701')).toBe('sy0-701');
  });
});

describe('category config integrity (study-prep taxonomy)', () => {
  it('has unique category slugs', () => {
    const slugs = categories.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has globally unique tag slugs (assertTagSlugsUnique passes)', () => {
    expect(() => assertTagSlugsUnique()).not.toThrow();
  });

  it('categories are derived 1:1 from exam families', () => {
    expect(categories.map((c) => c.slug).sort()).toEqual(examFamilies.map((f) => f.slug).sort());
  });

  it('exposes all 13 study-scout family slugs', () => {
    const slugs = categories.map((c) => c.slug);
    for (const slug of STUDY_FAMILY_SLUGS) {
      expect(slugs).toContain(slug);
    }
    expect(categories).toHaveLength(STUDY_FAMILY_SLUGS.length);
  });

  it('no longer contains legacy niche categories', () => {
    const slugs = categories.map((c) => c.slug);
    expect(slugs).not.toContain('crypto-web3');
    expect(slugs).not.toContain('ai-tech');
    expect(slugs).not.toContain('forex-stocks');
    expect(slugs).not.toContain('online-earning');
    expect(slugs).not.toContain('deals-coupons');
  });

  it('keeps the financial disclaimer flag false everywhere (study safety notice instead)', () => {
    expect(categories.every((c) => c.financialDisclaimerRequired === false)).toBe(true);
  });

  it('every exam family slug resolves to a configured category', () => {
    for (const family of examFamilies) {
      expect(categories.some((c) => c.slug === family.slug)).toBe(true);
    }
  });
});
