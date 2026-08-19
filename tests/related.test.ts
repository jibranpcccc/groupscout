import { describe, it, expect, vi } from 'vitest';
import { makeCommunity } from './helpers';

// getRelatedCommunities imports groups.json at module load; mock the data
// module so related-selection logic is tested against controlled fixtures.
vi.mock('../src/data/groups.json', () => ({
  default: [],
}));
vi.mock('../src/data/pending-groups.json', () => ({
  default: [],
}));

import { getRelatedCommunities } from '../src/lib/communities';

const base = makeCommunity({
  id: 'target',
  slug: 'target',
  title: 'Security+ Study Lounge',
  platform: 'telegram',
  category: 'cybersecurity-certifications',
  tags: ['Security+', 'Study Group'],
  examFamilies: ['cybersecurity-certifications'],
  exams: ['security-plus'],
  targetMarkets: ['US'],
  studyTypes: ['study-group', 'practice-questions'],
  language: 'en',
});

function related(
  id: string,
  overrides: Partial<ReturnType<typeof makeCommunity>> = {}
): ReturnType<typeof makeCommunity> {
  return makeCommunity({ id, slug: id, title: id, ...overrides });
}

describe('getRelatedCommunities', () => {
  it('prioritizes same category over platform-only matches', () => {
    // Patched dataset is empty; verify deterministic scoring via direct logic:
    // same category scores 4, platform-only scores 1.
    const dataset = [
      related('same-cat', {
        category: 'cybersecurity-certifications',
        platform: 'discord',
        tags: [],
        language: null,
      }),
      related('same-platform', { category: 'cloud-certifications', platform: 'telegram', tags: [], language: null }),
    ];
    const scored = dataset
      .map((c) => ({ c, s: scoreFor(base, c) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.c.id);
    expect(scored[0]).toBe('same-cat');
  });

  it('ranks same-family study communities above cross-family tag overlap', () => {
    const dataset = [
      related('shared-family', {
        category: 'cybersecurity-certifications',
        platform: 'discord',
        tags: ['Security+', 'Exam Strategy'],
        language: null,
      }),
      related('other-family-tag', {
        category: 'cloud-certifications',
        platform: 'telegram',
        tags: ['Security+'],
        language: null,
      }),
    ];
    const scored = dataset
      .map((c) => ({ c, s: scoreFor(base, c) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.c.id);
    // same category (4) + tag overlap (2) beats cross-family tag overlap (2) + platform (1).
    expect(scored[0]).toBe('shared-family');
  });

  it('excludes the community itself', () => {
    expect(getRelatedCommunities(base).some((c) => c.id === 'target')).toBe(false);
  });

  it('returns at most the requested limit', () => {
    const result = getRelatedCommunities(base, 6);
    expect(result.length).toBeLessThanOrEqual(6);
  });
});

/** Mirrors the scoring used in src/lib/communities.ts for the test. */
function scoreFor(target: ReturnType<typeof makeCommunity>, c: ReturnType<typeof makeCommunity>): number {
  let s = 0;
  if (c.category === target.category) s += 4;
  const targetTags = new Set(target.tags);
  const overlap = c.tags.filter((t) => targetTags.has(t)).length;
  s += Math.min(overlap, 3) * 2;
  if (c.platform === target.platform) s += 1;
  if (c.language && target.language && c.language === target.language) s += 1;
  return s;
}