import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { Community } from '../src/types/community';
import { exams } from '../src/config/exams';

describe('Production Content Cleanliness Gate', () => {
  const groupsPath = path.resolve(process.cwd(), 'src/data/groups.json');
  const groups: Community[] = JSON.parse(fs.readFileSync(groupsPath, 'utf8'));

  const FORBIDDEN_PATTERNS = [
    /telescope/i,
    /cdn\d?\.telesco\.pe/i,
    /telegram\.org\/dl/i,
    /\[Download\]/i,
    /Download\(/i,
    /\b(akshfd|asdfgh|qwertyuiop|lorem ipsum|test123|foobar)\b/i,
    /\d+[KkMm]?\s+subscribers\s+\d+/i,
    /!\[.*?\]\(http/i,
  ];

  it('has no forbidden garbage or scraped artifact patterns in any published listing', () => {
    const violations: Array<{ id: string; field: string; value: string; pattern: string }> = [];

    for (const g of groups) {
      const checkField = (field: string, val: string | null | undefined) => {
        if (!val) return;
        for (const pat of FORBIDDEN_PATTERNS) {
          if (pat.test(val)) {
            violations.push({ id: g.id, field, value: val, pattern: pat.toString() });
          }
        }
      };

      checkField('title', g.title);
      checkField('slug', g.slug);
      checkField('description', g.description);
      checkField('inviteUrl', g.inviteUrl);
    }

    expect(violations).toEqual([]);
  });

  it('has valid, clean, deterministic slugs for all published listings', () => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    for (const g of groups) {
      expect(g.slug).toMatch(slugRegex);
      expect(g.slug.length).toBeGreaterThanOrEqual(3);
      expect(g.slug.length).toBeLessThanOrEqual(100);
      expect(g.slug).not.toContain('telescope');
      expect(g.slug).not.toContain('download');
      expect(g.slug).not.toContain('subscribers');
    }
  });

  it('has human-readable, non-concatenated titles', () => {
    for (const g of groups) {
      expect(g.title.trim().length).toBeGreaterThanOrEqual(3);
      expect(g.title).not.toMatch(/^https?:\/\//i);
      expect(g.title).not.toMatch(/^telegram:\s*view/i);
      expect(g.title).not.toMatch(/^\d+[KkMm]?\s+subscribers$/i);
    }
  });

  it('ensures all assigned exams are legitimate config exams', () => {
    const validExams = new Set(exams.map(e => e.slug));
    for (const g of groups) {
      for (const exam of g.exams) {
        expect(validExams.has(exam)).toBe(true);
      }
    }
  });

  it('ensures descriptions contain no raw markdown image tags or download banners', () => {
    for (const g of groups) {
      if (g.description) {
        expect(g.description).not.toContain('![](http');
        expect(g.description).not.toContain('[Download]');
        expect(g.description).not.toContain('telesco.pe');
      }
    }
  });
});
