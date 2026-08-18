import { describe, it, expect } from 'vitest';
import { matchesFilters, sortCommunities, availableFilterOptions, normalizeFilters } from '../src/lib/filters';
import { searchCommunities } from '../src/lib/search';
import { makeCommunity } from './helpers';

const telegram = makeCommunity({
  id: 'a',
  slug: 'a',
  title: 'AI Builders Lounge',
  platform: 'telegram',
  category: 'ai-tech',
  tags: ['Artificial Intelligence', 'AI Agents'],
  language: 'en',
  accessType: 'free',
  verificationStatus: 'unverified',
  linkStatus: 'active',
  discoveredAt: '2026-08-02T00:00:00.000Z',
  lastCheckedAt: '2026-08-10T00:00:00.000Z',
});

const discord = makeCommunity({
  id: 'b',
  slug: 'b',
  title: 'DeFi Researchers',
  platform: 'discord',
  category: 'crypto-web3',
  tags: ['DeFi', 'Blockchain'],
  language: 'en',
  accessType: 'free',
  verificationStatus: 'source-confirmed',
  linkStatus: 'unknown',
  discoveredAt: '2026-08-01T00:00:00.000Z',
  lastCheckedAt: '2026-08-12T00:00:00.000Z',
});

const whatsapp = makeCommunity({
  id: 'c',
  slug: 'c',
  title: 'Freelance Hub',
  platform: 'whatsapp',
  category: 'online-earning',
  tags: ['Freelancing'],
  language: 'es',
  accessType: 'free',
  verificationStatus: 'unverified',
  linkStatus: 'active',
  discoveredAt: '2026-08-03T00:00:00.000Z',
  lastCheckedAt: null,
});

const all = [telegram, discord, whatsapp];

describe('matchesFilters', () => {
  it('filters by platform', () => {
    expect(all.filter((c) => matchesFilters(c, { platform: 'telegram' }))).toHaveLength(1);
  });
  it('filters by category + platform combined', () => {
    expect(all.filter((c) => matchesFilters(c, { category: 'ai-tech', platform: 'telegram' }))).toHaveLength(1);
    expect(all.filter((c) => matchesFilters(c, { category: 'ai-tech', platform: 'discord' }))).toHaveLength(0);
  });
  it('filters by tag slug', () => {
    expect(all.filter((c) => matchesFilters(c, { tag: 'defi' }))).toHaveLength(1);
  });
  it('filters by verification and link status', () => {
    expect(all.filter((c) => matchesFilters(c, { verification: 'source-confirmed' }))).toHaveLength(1);
    expect(all.filter((c) => matchesFilters(c, { linkStatus: 'unknown' }))).toHaveLength(1);
  });
});

describe('searchCommunities', () => {
  it('matches title tokens case-insensitively', () => {
    expect(searchCommunities(all, 'ai builders')).toHaveLength(1);
    expect(searchCommunities(all, 'AI BUILDERS')).toHaveLength(1);
  });
  it('matches tags and categories', () => {
    expect(searchCommunities(all, 'defi')).toHaveLength(1);
    expect(searchCommunities(all, 'crypto web3')).toHaveLength(1);
  });
  it('returns all for empty query', () => {
    expect(searchCommunities(all, '')).toHaveLength(3);
  });
});

describe('sortCommunities', () => {
  it('sorts by newest discoveredAt by default', () => {
    const sorted = sortCommunities(all, 'newest');
    expect(sorted[0]?.id).toBe('c');
  });
  it('sorts by recently checked', () => {
    const sorted = sortCommunities(all, 'recently-checked');
    expect(sorted[0]?.id).toBe('b');
  });
  it('sorts alphabetically', () => {
    const sorted = sortCommunities(all, 'alphabetical');
    expect(sorted.map((c) => c.title)).toEqual(['AI Builders Lounge', 'DeFi Researchers', 'Freelance Hub']);
  });
});

describe('availableFilterOptions', () => {
  it('derives options from data only', () => {
    const options = availableFilterOptions(all);
    expect(options.platforms).toEqual(['discord', 'telegram', 'whatsapp']);
    expect(options.languages).toEqual(['en', 'es']);
    expect(options.hasMemberCounts).toBe(false);
  });
});

describe('normalizeFilters', () => {
  it('reads and normalizes URL params', () => {
    const params = new URLSearchParams('platform=telegram&sort=alphabetical&q=ai&page=2');
    const filters = normalizeFilters(params);
    expect(filters.platform).toBe('telegram');
    expect(filters.sort).toBe('alphabetical');
    expect(filters.q).toBe('ai');
  });
  it('treats "all" as unset', () => {
    const params = new URLSearchParams('platform=all');
    expect(normalizeFilters(params).platform).toBeUndefined();
  });
});
