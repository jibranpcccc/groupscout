import { describe, it, expect } from 'vitest';
import { matchesFilters, sortCommunities, availableFilterOptions, normalizeFilters } from '../src/lib/filters';
import { searchCommunities } from '../src/lib/search';
import { makeCommunity } from './helpers';

// Study-prep fixtures: exam-family categories plus the exam-metadata arrays
// (examFamilies / exams / targetMarkets / studyTypes) of the new taxonomy.
const telegram = makeCommunity({
  id: 'a',
  slug: 'a',
  title: 'Security+ Study Lounge',
  platform: 'telegram',
  category: 'cybersecurity-certifications',
  tags: ['Security+', 'Study Group'],
  examFamilies: ['cybersecurity-certifications'],
  exams: ['security-plus'],
  targetMarkets: ['US'],
  studyTypes: ['study-group', 'practice-questions'],
  certificationProvider: 'CompTIA',
  examLevel: 'SY0-701',
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
  title: 'AWS Solutions Architect Prep',
  platform: 'discord',
  category: 'cloud-certifications',
  tags: ['AWS', 'Exam Prep'],
  examFamilies: ['cloud-certifications'],
  exams: ['aws'],
  targetMarkets: ['global-english'],
  studyTypes: ['study-group', 'resources'],
  certificationProvider: 'Amazon Web Services',
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
  title: 'IELTS Speaking Practice',
  platform: 'whatsapp',
  category: 'english-proficiency',
  tags: ['IELTS'],
  examFamilies: ['english-proficiency'],
  exams: ['ielts'],
  targetMarkets: ['UK'],
  studyTypes: ['practice-questions'],
  language: 'es',
  accessType: 'free',
  verificationStatus: 'unverified',
  linkStatus: 'active',
  discoveredAt: '2026-08-03T00:00:00.000Z',
  lastCheckedAt: null,
});

const all = [telegram, discord, whatsapp];

describe('study fixtures', () => {
  it('all carry the study-prep vertical and exam metadata', () => {
    for (const c of all) {
      expect(c.vertical).toBe('study-prep');
      expect(c.examFamilies).toHaveLength(1);
      expect(c.exams).toHaveLength(1);
      expect(c.targetMarkets.length).toBeGreaterThan(0);
      expect(c.studyTypes.length).toBeGreaterThan(0);
    }
    expect(telegram.exams).toContain('security-plus');
    expect(discord.exams).toContain('aws');
    expect(whatsapp.exams).toContain('ielts');
  });
});

describe('matchesFilters', () => {
  it('filters by platform', () => {
    expect(all.filter((c) => matchesFilters(c, { platform: 'telegram' }))).toHaveLength(1);
  });
  it('filters by category + platform combined', () => {
    expect(
      all.filter((c) => matchesFilters(c, { category: 'cybersecurity-certifications', platform: 'telegram' }))
    ).toHaveLength(1);
    expect(
      all.filter((c) => matchesFilters(c, { category: 'cybersecurity-certifications', platform: 'discord' }))
    ).toHaveLength(0);
  });
  it('filters by tag slug', () => {
    expect(all.filter((c) => matchesFilters(c, { tag: 'study-group' }))).toHaveLength(1);
    expect(all.filter((c) => matchesFilters(c, { tag: 'exam-prep' }))).toHaveLength(1);
  });
  it('filters by verification and link status', () => {
    expect(all.filter((c) => matchesFilters(c, { verification: 'source-confirmed' }))).toHaveLength(1);
    expect(all.filter((c) => matchesFilters(c, { linkStatus: 'unknown' }))).toHaveLength(1);
  });
});

describe('searchCommunities', () => {
  it('matches title tokens case-insensitively', () => {
    expect(searchCommunities(all, 'security lounge')).toHaveLength(1);
    expect(searchCommunities(all, 'SECURITY LOUNGE')).toHaveLength(1);
  });
  it('matches tags and categories', () => {
    expect(searchCommunities(all, 'aws')).toHaveLength(1);
    expect(searchCommunities(all, 'cloud certifications')).toHaveLength(1);
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
    expect(sorted.map((c) => c.title)).toEqual([
      'AWS Solutions Architect Prep',
      'IELTS Speaking Practice',
      'Security+ Study Lounge',
    ]);
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
