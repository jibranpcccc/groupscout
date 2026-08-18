/**
 * Core domain types for the Community Directory.
 *
 * Rule: every field that cannot be confirmed with real evidence must be
 * `null` / `"unknown"`. The UI hides unavailable fields — it never invents
 * values. See AGENTS.md §4 for the data integrity rules.
 */

export type Platform = 'telegram' | 'whatsapp' | 'discord';

export type CategorySlug =
  | 'crypto-web3'
  | 'forex-stocks'
  | 'ai-tech'
  | 'online-earning'
  | 'deals-coupons';

export type VerificationStatus =
  | 'unverified'
  | 'source-confirmed'
  | 'owner-confirmed'
  | 'manually-reviewed';

export type LinkStatus = 'active' | 'unknown' | 'dead' | 'removed' | 'reported';

export type AccessType = 'free' | 'paid' | 'mixed' | 'unknown';

export type CommunityType =
  | 'discussion'
  | 'education'
  | 'signals'
  | 'news'
  | 'jobs'
  | 'deals'
  | 'support'
  | 'other'
  | 'unknown';

export type DiscoveryMethod =
  | 'gemini-search'
  | 'manual'
  | 'user-submission'
  | 'platform-api'
  | 'other';

export interface Community {
  /** Persistent unique id. Never changes (used in report/prefill forms). */
  id: string;
  /** Persistent URL slug. Never changes with title edits. */
  slug: string;
  title: string;

  platform: Platform;

  /** Must reference a configured category slug (src/config/categories.ts). */
  category: CategorySlug;
  subcategory?: string | null;
  tags: string[];

  /** Normalized destination URL. Must be a real, public invite URL. */
  inviteUrl: string;

  /** Concise factual description. External text is treated as untrusted. */
  description?: string | null;

  language?: string | null;
  country?: string | null;

  accessType?: AccessType;
  communityType?: CommunityType;

  /** Member count is ONLY allowed when all three fields are populated from a real source. */
  memberCount?: number | null;
  memberCountSource?: string | null;
  memberCountCheckedAt?: string | null;

  verificationStatus: VerificationStatus;

  linkStatus: LinkStatus;
  /** ISO-8601 timestamp of the most recent link check. */
  lastCheckedAt?: string | null;

  /** Real URLs that evidence this listing's existence. */
  sourceUrls: string[];

  discoveryMethod: DiscoveryMethod;
  discoveredAt: string;
  updatedAt?: string | null;

  /** Moderation flags (e.g. "potential-risk-language"). Not consumer-facing safety ratings. */
  safetyFlags?: string[];

  /** Editorial placement only — never implies "best" or a rating. */
  featured?: boolean;

  /** Marks development/demo fixtures that must be removed before production. */
  isSample?: boolean;

  published: boolean;
}
