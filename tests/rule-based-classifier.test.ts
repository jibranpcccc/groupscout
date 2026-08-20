import { describe, it, expect } from 'vitest';
import { ruleBasedClassify } from '../scripts/classify/ruleBasedClassifier';
import type { ParsedCandidate } from '../scripts/discover/parseCandidates';

function cand(overrides: Partial<ParsedCandidate>): ParsedCandidate {
  return {
    candidateUrl: 'https://discord.com/invite/x',
    sourceUrl: 'https://discord.com/invite/x',
    platform: 'discord',
    confidence: 0.7,
    evidence: '',
    suggestedSlug: 'x',
    ...overrides,
  } as ParsedCandidate;
}

describe('ruleBasedClassify — deterministic pre-tier', () => {
  it('classifies apstudents as ap-exams (was wrongly rejected before)', () => {
    const m = ruleBasedClassify({
      candidate: cand({ candidateUrl: 'https://discord.com/invite/apstudents', evidence: 'AP Students — Advanced Placement study community' }),
    });
    expect(m).not.toBeNull();
    expect(m!.result.relevance).toBe(true);
    expect(m!.result.exams).toContain('ap-exams');
    expect(m!.result.category).toBe('college-admissions');
  });

  it('classifies sat_files telegram as sat', () => {
    const m = ruleBasedClassify({
      candidate: cand({ candidateUrl: 'https://t.me/sat_files', platform: 'telegram', evidence: 'free SAT practice materials' }),
    });
    expect(m).not.toBeNull();
    expect(m!.result.relevance).toBe(true);
    expect(m!.result.exams).toContain('sat');
  });

  it('classifies generic study servers as general-study, not rejected', () => {
    const m = ruleBasedClassify({
      candidate: cand({ candidateUrl: 'https://discord.com/invite/studywithme', evidence: 'study together, focus rooms, pomodoro' }),
    });
    expect(m).not.toBeNull();
    expect(m!.result.relevance).toBe(true);
    expect(m!.result.exams).toEqual([]);
    expect(m!.result.category).toBe('general-study');
  });

  it('returns null for off-niche candidates (no signal → Gemini tier)', () => {
    const m = ruleBasedClassify({
      candidate: cand({ candidateUrl: 'https://discord.com/invite/quantdata', evidence: 'quant finance trading data discussions' }),
    });
    expect(m).toBeNull();
  });

  it('ignores the query anchor tag (candidate evidence decides, not query context)', () => {
    // A "sat" query can return off-topic servers — the anchor tag must not
    // make them look relevant.
    const m = ruleBasedClassify({
      candidate: cand({ candidateUrl: 'https://chat.whatsapp.com/abc', platform: 'whatsapp', evidence: 'random chat group' }),
    });
    expect(m).toBeNull();
  });
});
