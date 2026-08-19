import { describe, it, expect } from 'vitest';
import { communitySchema, findProductionViolations } from '../src/lib/schema';
import { makeCommunity } from './helpers';

describe('vertical guard (study-prep only)', () => {
  it('schema requires the vertical literal to be "study-prep"', () => {
    expect(communitySchema.safeParse(makeCommunity()).success).toBe(true);

    const bad = makeCommunity({ vertical: 'crypto' as never });
    expect(communitySchema.safeParse(bad).success).toBe(false);

    const { vertical: _vertical, ...withoutVertical } = makeCommunity();
    expect(communitySchema.safeParse(withoutVertical).success).toBe(false);
  });

  it('production guard rejects published records with any non-study-prep vertical', () => {
    const records = [
      makeCommunity({
        published: true,
        vertical: 'crypto-web3' as never,
        inviteUrl: 'https://t.me/legacycrypto',
        sourceUrls: ['https://medium.com/@real/source'],
      }),
      makeCommunity({
        published: true,
        vertical: 'ai-tech' as never,
        inviteUrl: 'https://t.me/legacyai',
        sourceUrls: ['https://medium.com/@real/source'],
      }),
      makeCommunity({
        published: true,
        vertical: 'online-earning' as never,
        inviteUrl: 'https://t.me/legacyjobs',
        sourceUrls: ['https://medium.com/@real/source'],
      }),
    ];
    const violations = findProductionViolations(records);
    expect(violations).toHaveLength(3);
    expect(violations.every((v) => v.reason.includes('vertical'))).toBe(true);
    expect(violations.every((v) => v.reason.includes('study-prep'))).toBe(true);
  });

  it('production guard allows unpublished legacy-vertical records (pending migration)', () => {
    const violations = findProductionViolations([
      makeCommunity({ published: false, vertical: 'crypto-web3' as never }),
    ]);
    expect(violations).toHaveLength(0);
  });

  it('production guard passes published study-prep records', () => {
    const violations = findProductionViolations([
      makeCommunity({
        published: true,
        category: 'cybersecurity-certifications',
        inviteUrl: 'https://discord.gg/realstudy',
        sourceUrls: ['https://medium.com/@real/announcement'],
      }),
    ]);
    expect(violations).toHaveLength(0);
  });
});