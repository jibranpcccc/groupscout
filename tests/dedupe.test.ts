import { describe, it, expect } from 'vitest';
import { dedupeCandidates, similarity } from '../scripts/data/deduplicate';
import { makeCommunity } from './helpers';

describe('dedupeCandidates', () => {
  it('detects duplicate by normalized invite URL', () => {
    const existing = [makeCommunity({ inviteUrl: 'https://t.me/example', platform: 'telegram' })];
    const candidates = [
      {
        candidateUrl: 'https://T.ME/example',
        sourceUrl: 'https://example.com/source',
        platform: 'telegram',
        title: 'Example',
        confidence: 0.9,
      },
    ];
    const result = dedupeCandidates(candidates, existing);
    expect(result.duplicates).toHaveLength(1);
    expect(result.unique).toHaveLength(0);
  });

  it('detects duplicate by platform identity key across URL forms', () => {
    const existing = [makeCommunity({ inviteUrl: 'https://t.me/example', platform: 'telegram' })];
    const candidates = [
      {
        candidateUrl: 'https://telegram.me/example',
        sourceUrl: 'https://example.com/source',
        platform: 'telegram',
        title: 'Totally different title',
        confidence: 0.9,
      },
    ];
    const result = dedupeCandidates(candidates, existing);
    expect(result.duplicates).toHaveLength(1);
  });

  it('routes slug collisions to ambiguous', () => {
    const existing = [makeCommunity({ slug: 'crypto-chat', inviteUrl: 'https://t.me/one' })];
    const candidates = [
      {
        candidateUrl: 'https://t.me/two',
        sourceUrl: 'https://example.com/source',
        platform: 'telegram',
        title: 'Crypto Chat Two',
        slug: 'crypto-chat',
        confidence: 0.9,
      },
    ];
    const result = dedupeCandidates(candidates, existing);
    expect(result.ambiguous).toHaveLength(1);
  });

  it('routes near-identical titles on same platform to ambiguous (never auto-merge)', () => {
    const existing = [makeCommunity({ title: 'AI Builders Lounge', inviteUrl: 'https://t.me/one' })];
    const candidates = [
      {
        candidateUrl: 'https://t.me/two',
        sourceUrl: 'https://example.com/source',
        platform: 'telegram',
        title: 'AI Builders Lounge (New)',
        confidence: 0.9,
      },
    ];
    const result = dedupeCandidates(candidates, existing);
    expect(result.ambiguous).toHaveLength(1);
  });

  it('keeps genuinely new candidates as unique', () => {
    const existing = [makeCommunity({ inviteUrl: 'https://t.me/one' })];
    const candidates = [
      {
        candidateUrl: 'https://t.me/another-channel',
        sourceUrl: 'https://example.com/source',
        platform: 'telegram',
        title: 'Another Channel',
        confidence: 0.9,
      },
    ];
    const result = dedupeCandidates(candidates, existing);
    expect(result.unique).toHaveLength(1);
  });
});

describe('similarity', () => {
  it('scores identical titles as 1', () => {
    expect(similarity('AI Builders', 'AI Builders')).toBe(1);
  });
  it('scores very different titles low', () => {
    expect(similarity('AI Builders', 'Crypto Traders Daily')).toBeLessThan(0.5);
  });
});
