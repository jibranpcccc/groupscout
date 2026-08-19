import type { Community } from '../src/types/community';

/** Minimal valid study-prep Community fixture for tests (never a real listing). */
export function makeCommunity(overrides: Partial<Community> = {}): Community {
  return {
    id: 'test-community-001',
    slug: 'test-community',
    title: 'Test Study Community',
    platform: 'discord',
    vertical: 'study-prep',
    category: 'general-study',
    tags: ['Exam Prep'],
    examFamilies: [],
    exams: [],
    targetMarkets: [],
    studyTypes: [],
    inviteUrl: 'https://discord.gg/testcommunity',
    description: 'A test study community fixture.',
    language: null,
    country: null,
    accessType: 'unknown',
    communityType: 'unknown',
    memberCount: null,
    memberCountSource: null,
    memberCountCheckedAt: null,
    verificationStatus: 'unverified',
    linkStatus: 'active',
    sourceUrls: ['https://example.org/source'],
    discoveryMethod: 'manual',
    discoveredAt: '2026-08-18T00:00:00.000Z',
    lastCheckedAt: '2026-08-18T00:00:00.000Z',
    published: false,
    ...overrides,
  };
}
