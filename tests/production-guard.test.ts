import { describe, it, expect } from 'vitest';
import { findProductionViolations } from '../src/lib/schema';
import { makeCommunity } from './helpers';

/** A clean, real-looking record that must ALWAYS pass the production guard. */
function realRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ...makeCommunity({
      isSample: false,
      inviteUrl: 'https://t.me/realpublicchannel',
      sourceUrls: ['https://medium.com/@real-community/announcement'], // non-demo host
      title: 'Real Public Channel',
      description: 'A real public community.',
    }),
    ...overrides,
  };
}

describe('findProductionViolations (production safety guard)', () => {
  it('passes a clean real record', () => {
    expect(findProductionViolations([realRecord()])).toHaveLength(0);
  });

  it('fails any record with isSample === true', () => {
    const violations = findProductionViolations([realRecord({ isSample: true })]);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.reason).toContain('isSample');
  });

  it('fails published records whose inviteUrl hostname is example.com', () => {
    const violations = findProductionViolations([
      realRecord({ inviteUrl: 'https://example.com/demo-community' }),
    ]);
    expect(violations.some((v) => v.reason.includes('inviteUrl hostname'))).toBe(true);
  });

  it('fails published records whose sourceUrls contain example.com', () => {
    const violations = findProductionViolations([
      realRecord({ sourceUrls: ['https://example.com/demo-source'] }),
    ]);
    expect(violations.some((v) => v.reason.includes('sourceUrls'))).toBe(true);
  });

  it('fails published records whose title contains "(Demo)"', () => {
    const violations = findProductionViolations([realRecord({ title: 'AI Builders Lounge (Demo)' })]);
    expect(violations.some((v) => v.reason.includes('title'))).toBe(true);
  });

  it('fails published records whose description contains "Demo fixture"', () => {
    const violations = findProductionViolations([
      realRecord({ description: 'Demo fixture: a fictional community.' }),
    ]);
    expect(violations.some((v) => v.reason.includes('description'))).toBe(true);
  });

  it('allows unpublished sample records (pending review fixtures)', () => {
    const violations = findProductionViolations([
      realRecord({ published: false, isSample: true, inviteUrl: 'https://example.com/pending-demo' }),
    ]);
    // isSample=true still flags; ensure only the isSample rule fires for unpublished.
    expect(violations.length).toBe(1);
  });

  it('passes real platform URLs (t.me, discord.gg)', () => {
    const records = [
      realRecord({ inviteUrl: 'https://t.me/durov' }),
      realRecord({ inviteUrl: 'https://discord.gg/python' }),
      realRecord({ inviteUrl: 'https://chat.whatsapp.com/RealCode123' }),
    ];
    expect(findProductionViolations(records)).toHaveLength(0);
  });
});
