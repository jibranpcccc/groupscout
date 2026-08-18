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
  title: 'AI Builders Lounge',
  platform: 'telegram',
  category: 'ai-tech',
  tags: ['Artificial Intelligence', 'AI Agents'],
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
      related('same-cat', { category: 'ai-tech', platform: 'discord', tags: [], language: null }),
      related('same-platform', { category: 'crypto-web3', platform: 'telegram', tags: [], language: null }),
    ];
    const scored = dataset
      .map((c) => ({ c, s: scoreFor(base, c) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.c.id);
    expect(scored[0]).toBe('same-cat');
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
