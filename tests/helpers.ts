import type { Community } from '../src/types/community';

/** Minimal valid Community fixture for tests (never a real listing). */
export function makeCommunity(overrides: Partial<Community> = {}): Community {
  return {
    id: 'test-community',
    slug: 'test-community',
    title: 'Test Community',
    platform: 'telegram',
    category: 'ai-tech',
    subcategory: null,
    tags: ['Artificial Intelligence'],
    inviteUrl: 'https://example.com/demo-test-community',
    description: 'Test fixture only.',
    language: 'en',
    country: null,
    accessType: 'free',
    communityType: 'discussion',
    memberCount: null,
    memberCountSource: null,
    memberCountCheckedAt: null,
    verificationStatus: 'unverified',
    linkStatus: 'active',
    lastCheckedAt: '2026-08-01T00:00:00.000Z',
    sourceUrls: ['https://example.com/demo-source'],
    discoveryMethod: 'manual',
    discoveredAt: '2026-08-01T00:00:00.000Z',
    updatedAt: null,
    safetyFlags: [],
    featured: false,
    isSample: true,
    published: true,
    ...overrides,
  };
}
