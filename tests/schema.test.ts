import { describe, it, expect } from 'vitest';
import { communitySchema, validateDataset } from '../src/lib/schema';
import { makeCommunity } from './helpers';
import { categories } from '../src/config/categories';

const LEGACY_NICHE_CATEGORIES = ['crypto-web3', 'ai-tech', 'forex-stocks', 'online-earning', 'deals-coupons'];

describe('communitySchema', () => {
  it('accepts a valid record', () => {
    const result = communitySchema.safeParse(makeCommunity());
    expect(result.success).toBe(true);
  });

  it('accepts every configured category slug (study-prep families)', () => {
    for (const category of categories) {
      const ok = makeCommunity({ category: category.slug });
      expect(communitySchema.safeParse(ok).success).toBe(true);
    }
  });

  it('requires the vertical to be the "study-prep" literal', () => {
    const bad = makeCommunity({ vertical: 'crypto' as never });
    expect(communitySchema.safeParse(bad).success).toBe(false);

    const { vertical: _vertical, ...withoutVertical } = makeCommunity();
    expect(communitySchema.safeParse(withoutVertical).success).toBe(false);
  });

  it('rejects legacy niche categories', () => {
    for (const legacy of LEGACY_NICHE_CATEGORIES) {
      const bad = makeCommunity({ category: legacy as never });
      expect(communitySchema.safeParse(bad).success).toBe(false);
    }
  });

  it('rejects invalid platform values', () => {
    const bad = makeCommunity({ platform: 'slack' as never });
    expect(communitySchema.safeParse(bad).success).toBe(false);
  });

  it('rejects invalid verification enums', () => {
    const bad = makeCommunity({ verificationStatus: 'verified' as never });
    expect(communitySchema.safeParse(bad).success).toBe(false);
  });

  it('rejects malformed URLs', () => {
    const bad = makeCommunity({ inviteUrl: 'not-a-url' });
    expect(communitySchema.safeParse(bad).success).toBe(false);
  });

  it('rejects non-ISO dates', () => {
    const bad = makeCommunity({ discoveredAt: 'yesterday' });
    expect(communitySchema.safeParse(bad).success).toBe(false);
  });

  it('rejects member counts without a source', () => {
    const bad = makeCommunity({ memberCount: 100, memberCountSource: null, memberCountCheckedAt: null });
    expect(communitySchema.safeParse(bad).success).toBe(false);
  });

  it('accepts member counts with a full source triple', () => {
    const ok = makeCommunity({
      memberCount: 100,
      memberCountSource: 'https://discord.com/api/v10/guilds/123/preview',
      memberCountCheckedAt: '2026-08-01T00:00:00.000Z',
    });
    expect(communitySchema.safeParse(ok).success).toBe(true);
  });

  it('rejects member counts whose source is an unrelated external website', () => {
    const bad = makeCommunity({
      memberCount: 100,
      memberCountSource: 'https://example.com/source',
      memberCountCheckedAt: '2026-08-01T00:00:00.000Z',
    });
    expect(communitySchema.safeParse(bad).success).toBe(false);
  });

  it('rejects unknown categories', () => {
    const bad = makeCommunity({ category: 'not-a-category' as never });
    expect(communitySchema.safeParse(bad).success).toBe(false);
  });

  it('rejects unknown extra fields (strict)', () => {
    const bad = { ...makeCommunity(), invented: true };
    expect(communitySchema.safeParse(bad).success).toBe(false);
  });

  it('accepts the new study-metadata fields (certificationProvider, examLevel, arrays)', () => {
    const ok = makeCommunity({
      category: 'cybersecurity-certifications',
      examFamilies: ['cybersecurity-certifications'],
      exams: ['security-plus'],
      targetMarkets: ['US', 'global-english'],
      certificationProvider: 'CompTIA',
      studyTypes: ['study-group', 'practice-questions', 'accountability'],
      examLevel: 'SY0-701',
    });
    expect(communitySchema.safeParse(ok).success).toBe(true);
  });

  it('rejects invalid target markets', () => {
    const bad = makeCommunity({ targetMarkets: ['EU' as never] });
    expect(communitySchema.safeParse(bad).success).toBe(false);
  });

  it('rejects invalid study types', () => {
    const bad = makeCommunity({ studyTypes: ['cramming' as never] });
    expect(communitySchema.safeParse(bad).success).toBe(false);
  });

  it('caps examFamilies and exams arrays at 8 entries', () => {
    const nine = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9'];
    expect(communitySchema.safeParse(makeCommunity({ examFamilies: nine })).success).toBe(false);
    expect(communitySchema.safeParse(makeCommunity({ exams: nine })).success).toBe(false);
  });
});

describe('validateDataset', () => {
  it('flags duplicate ids across files', () => {
    const a = makeCommunity({ id: 'dup-id', slug: 'one' });
    const b = makeCommunity({ id: 'dup-id', slug: 'two' });
    const result = validateDataset([a], [b]);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('duplicate id'))).toBe(true);
  });

  it('flags duplicate invite URLs', () => {
    const a = makeCommunity({ slug: 'one', inviteUrl: 'https://t.me/example' });
    const b = makeCommunity({ slug: 'two', inviteUrl: 'https://t.me/example' });
    const result = validateDataset([a, b]);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('duplicate invite URL'))).toBe(true);
  });

  it('passes a clean dataset', () => {
    const result = validateDataset([
      makeCommunity({ id: 'one', slug: 'one', inviteUrl: 'https://t.me/one' }),
      makeCommunity({ id: 'two', slug: 'two', inviteUrl: 'https://t.me/two' }),
    ]);
    expect(result.ok).toBe(true);
  });
});