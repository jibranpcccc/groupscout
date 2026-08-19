import { describe, it, expect } from 'vitest';
import {
  assessAffiliationClaim,
  guardAffiliation,
  AFFILIATION_CLAIM_FLAG,
  AFFILIATION_CORROBORATED_FLAG,
} from '../scripts/safety/affiliationGuard';

/**
 * Official-affiliation guard tests.
 *
 * Contract:
 *  - An explicit "Official <Provider>" claim (SAT, IELTS, AWS, CFA, CompTIA,
 *    Cisco, ...) that is NOT backed by an authoritative source URL must be
 *    flagged (safetyFlags) and must block owner-confirmed treatment.
 *  - The same claim IS corroborated when a source URL points at the provider's
 *    authoritative domain — then no block.
 *  - Provider NAME SIMILARITY alone (e.g. a title like "SAT Study With Me", a
 *    description that merely mentions "AWS") must NEVER trigger.
 */
describe('assessAffiliationClaim — rejects unsupported official claims', () => {
  const UNSUPPORTED: Array<[string, { title?: string; description?: string }]> = [
    ['title claims Official SAT', { title: 'Official SAT Prep Group' }],
    ['title claims Official IELTS', { title: 'Official IELTS Study Community' }],
    ['title claims Official AWS', { title: 'Official AWS Certification Help' }],
    ['title claims Official CFA', { title: 'Official CFA Exam Support' }],
    ['description claims Official CompTIA', { description: 'We are the Official CompTIA training group' }],
    ['title claims Official Cisco', { title: 'Official Cisco Networking Study' }],
    ['title claims Official PMP', { title: 'Official PMP Prep' }],
    ['title claims Official USMLE', { title: 'Official USMLE Step 1 Group' }],
  ];

  for (const [label, input] of UNSUPPORTED) {
    it(`flags "${label}" when there is no authoritative source URL`, () => {
      const result = assessAffiliationClaim(input);
      expect(result.claimed).toBe(true);
      expect(result.corroborated).toBe(false);
      expect(result.flags).toContain(AFFILIATION_CLAIM_FLAG);
      expect(result.blockOwnerConfirmed).toBe(true);
    });
  }

  it('flags an "Official <Provider>" claim even when unrelated source URLs exist', () => {
    const result = assessAffiliationClaim({
      title: 'Official AWS Group',
      sourceUrls: ['https://t.me/some-unrelated-channel', 'https://discord.gg/xyz'],
    });
    expect(result.claimed).toBe(true);
    expect(result.corroborated).toBe(false);
    expect(result.blockOwnerConfirmed).toBe(true);
  });

  it('does not treat an unrecognised "Official <word>" as an affiliation claim', () => {
    // Ordinary English ("Official Study Group", "Official Weekly Meetup") —
    // name-similarity must never trigger a flag.
    const result = assessAffiliationClaim({ title: 'Official Zigazoo Study' });
    expect(result.claimed).toBe(false);
    expect(result.flags).toEqual([]);
    expect(result.blockOwnerConfirmed).toBe(false);
  });
});

describe('assessAffiliationClaim — corroborates claims backed by authoritative URLs', () => {
  it('accepts Official SAT backed by collegeboard.org', () => {
    const result = assessAffiliationClaim({
      title: 'Official SAT Prep',
      sourceUrls: ['https://collegeboard.org/official-sat-prep'],
    });
    expect(result.claimed).toBe(true);
    expect(result.corroborated).toBe(true);
    expect(result.corroboratedProvider).toBe('SAT');
    expect(result.flags).toContain(AFFILIATION_CORROBORATED_FLAG);
    expect(result.flags).not.toContain(AFFILIATION_CLAIM_FLAG);
    expect(result.blockOwnerConfirmed).toBe(false);
  });

  it('accepts Official IELTS backed by ielts.org', () => {
    const result = assessAffiliationClaim({
      title: 'Official IELTS Practice',
      sourceUrls: ['https://www.ielts.org/for-test-takers'],
    });
    expect(result.corroborated).toBe(true);
  });

  it('accepts Official CompTIA backed by a www.comptia.org subdomain', () => {
    const result = assessAffiliationClaim({
      title: 'Official CompTIA Training',
      sourceUrls: ['https://www.comptia.org/certifications'],
    });
    expect(result.corroborated).toBe(true);
  });

  it('accepts Official AWS backed by aws.amazon.com', () => {
    const result = assessAffiliationClaim({
      title: 'Official AWS Certification',
      sourceUrls: ['https://aws.amazon.com/certification/'],
    });
    expect(result.corroborated).toBe(true);
  });
});

describe('assessAffiliationClaim — name similarity alone must NOT trigger', () => {
  const SIMILAR_ONLY: Array<[string, { title?: string; description?: string }]> = [
    ['title "SAT Study With Me"', { title: 'SAT Study With Me Community' }],
    ['title "AWS Study Group"', { title: 'AWS Study Group' }],
    ['title "IELTS Prep Buddies"', { title: 'IELTS Prep Buddies' }],
    ['title "CFA Aspirants"', { title: 'CFA Aspirants' }],
    ['title "CompTIA Sprint"', { title: 'CompTIA Sprint' }],
    ['title "Cisco Routing Study"', { title: 'Cisco Routing Study' }],
    ['description mentions "official study" without provider', { description: 'Share official study materials and notes' }],
    ['description mentions provider without "official"', { description: 'A community for people taking the AWS cert' }],
    ['title uses "official" as an ordinary adjective (no provider)', { title: 'Our Official Weekly Meetup' }],
  ];

  for (const [label, input] of SIMILAR_ONLY) {
    it(`does NOT flag "${label}"`, () => {
      const result = assessAffiliationClaim(input);
      expect(result.claimed, `expected no claim for: ${JSON.stringify(input)}`).toBe(false);
      expect(result.flags).toEqual([]);
      expect(result.blockOwnerConfirmed).toBe(false);
    });
  }
});

describe('guardAffiliation — record integration', () => {
  it('adds the safety flag to a non-owner-confirmed record', () => {
    const result = guardAffiliation(
      { safetyFlags: [], verificationStatus: 'source-confirmed' },
      { title: 'Official GRE Group' }
    );
    expect(result.record.safetyFlags).toContain(AFFILIATION_CLAIM_FLAG);
    expect(result.record.verificationStatus).toBe('source-confirmed');
    expect(result.downgradedFromOwnerConfirmed).toBe(false);
  });

  it('downgrades an owner-confirmed record whose claim is unsupported', () => {
    const result = guardAffiliation(
      { safetyFlags: [], verificationStatus: 'owner-confirmed' },
      { title: 'Official Cisco Group' }
    );
    expect(result.downgradedFromOwnerConfirmed).toBe(true);
    expect(result.record.verificationStatus).toBe('source-confirmed');
    expect(result.record.safetyFlags).toContain(AFFILIATION_CLAIM_FLAG);
  });

  it('does not touch an owner-confirmed record when the claim is corroborated', () => {
    const result = guardAffiliation(
      { safetyFlags: [], verificationStatus: 'owner-confirmed' },
      { title: 'Official Cisco Group', sourceUrls: ['https://cisco.com/community'] }
    );
    expect(result.downgradedFromOwnerConfirmed).toBe(false);
    expect(result.record.verificationStatus).toBe('owner-confirmed');
    expect(result.record.safetyFlags).toContain(AFFILIATION_CORROBORATED_FLAG);
  });

  it('leaves a record untouched when no official claim is made', () => {
    const result = guardAffiliation(
      { safetyFlags: ['some-other-flag'], verificationStatus: 'owner-confirmed' },
      { title: 'SAT Study With Me' }
    );
    expect(result.assessment.claimed).toBe(false);
    expect(result.record.safetyFlags).toEqual(['some-other-flag']);
    expect(result.record.verificationStatus).toBe('owner-confirmed');
  });

  it('dedupes flags when the record already carries the claim flag', () => {
    const result = guardAffiliation(
      { safetyFlags: [AFFILIATION_CLAIM_FLAG], verificationStatus: 'unverified' },
      { title: 'Official AWS Group' }
    );
    expect(result.record.safetyFlags).toEqual([AFFILIATION_CLAIM_FLAG]);
  });
});
