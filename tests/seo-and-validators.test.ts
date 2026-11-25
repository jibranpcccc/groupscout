import { describe, it, expect, vi, afterEach } from 'vitest';
import { websiteGraphNode, communityTitle } from '../src/lib/seo';
import { validateDiscordDetailed } from '../scripts/validate/discord';
import { makeCommunity } from './helpers';

describe('SEO schema & title helpers', () => {
  it('omits deprecated SearchAction from websiteGraphNode', () => {
    const node = websiteGraphNode() as Record<string, unknown>;
    expect(node['@type']).toBe('WebSite');
    expect('potentialAction' in node).toBe(false);
    expect(JSON.stringify(node)).not.toContain('SearchAction');
  });

  it('keeps communityTitle concise (<= 65 chars) while preserving exam and platform where possible', () => {
    const short = makeCommunity({
      title: 'AP Students',
      platform: 'discord',
      exams: ['ap-exams'],
    });
    const shortTitle = communityTitle(short);
    expect(shortTitle).toContain('AP Students');
    expect(shortTitle).toContain('StudyGroupsHub');
    expect(shortTitle.length).toBeLessThanOrEqual(65);

    const medium = makeCommunity({
      title: 'Admission Hackers [SAT Prep]',
      platform: 'discord',
      exams: ['sat'],
    });
    const mediumTitle = communityTitle(medium);
    expect(mediumTitle).toContain('Admission Hackers [SAT Prep]');
    expect(mediumTitle).toContain('SAT');
    expect(mediumTitle.length).toBeLessThanOrEqual(65);

    const veryLong = makeCommunity({
      title: 'International Medical Licensing Comprehensive Study Discussion Group 2026',
      platform: 'telegram',
      exams: ['usmle'],
    });
    const veryLongTitle = communityTitle(veryLong);
    expect(veryLongTitle).toContain('StudyGroupsHub');
    expect(veryLongTitle.length).toBeLessThanOrEqual(65);
  });
});

describe('Discord invite validator', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('extracts top-level approximate_member_count and guild description', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({
        approximate_member_count: 14510,
        guild: {
          id: '123456789',
          name: 'Admission Hackers [SAT Prep]',
          description: 'Active study community for Digital SAT and ACT exam preparation.',
        },
      }),
    }) as unknown as typeof fetch;

    const result = await validateDiscordDetailed('https://discord.gg/z3y3e39n9h');
    expect(result.status).toBe('active');
    expect(result.guildId).toBe('123456789');
    expect(result.memberCount).toBe(14510);
    expect(result.guildDescription).toBe(
      'Active study community for Digital SAT and ACT exam preparation.'
    );
    expect(result.sourceUrl).toContain('discord.com/api/v10/invites/z3y3e39n9h');
  });
});
