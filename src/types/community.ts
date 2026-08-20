/**
 * Core domain types for the StudyScout directory.
 *
 * Rule: every field that cannot be confirmed with real evidence must be
 * `null` / `"unknown"` / `[]`. The UI hides unavailable fields — it never
 * invents values. See AGENTS.md §4 for the data integrity rules.
 */

export type Platform = 'telegram' | 'whatsapp' | 'discord';

/**
 * Category slugs = exam-family slugs (src/config/examFamilies.ts).
 * A community's `category` is its primary exam family.
 */
export type CategorySlug =
  | 'college-admissions'
  | 'graduate-admissions'
  | 'entrance-exams'
  | 'english-proficiency'
  | 'medical-healthcare'
  | 'law'
  | 'finance-accounting'
  | 'technology-certifications'
  | 'cybersecurity-certifications'
  | 'cloud-certifications'
  | 'networking-certifications'
  | 'project-management'
  | 'professional-licensing'
  | 'general-study';

/** Exam slug (src/config/exams.ts). Validated against config at dataset level. */
export type ExamSlug = string;

/** Target markets — never guessed; only with evidence or config-justified defaults. */
export type TargetMarket = 'US' | 'UK' | 'CA' | 'AU' | 'NZ' | 'IE' | 'global-english';

/** Study types describe how a community supports exam preparation. */
export type StudyType =
  | 'discussion'
  | 'study-group'
  | 'practice-questions'
  | 'accountability'
  | 'resources'
  | 'exam-strategy'
  | 'peer-support';

/** The single supported vertical. Production guard rejects anything else. */
export type Vertical = 'study-prep';

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

  /** The directory's single vertical — every published record must be study-prep. */
  vertical: Vertical;

  /** Must reference a configured category (exam family) slug. */
  category: CategorySlug;
  subcategory?: string | null;
  tags: string[];

  /** Exam-family slugs this community covers (src/config/examFamilies.ts). */
  examFamilies: string[];
  /** Exam slugs this community covers (src/config/exams.ts). Never guessed. */
  exams: string[];
  /** Target markets — only with evidence or config-justified defaults. */
  targetMarkets: TargetMarket[];
  /** Certification body when known (e.g. "CompTIA") — never assumed from a name. */
  certificationProvider?: string | null;
  /** Study types observed (discussion, study-group, practice-questions, ...). */
  studyTypes: StudyType[];
  /** Exam level when known (e.g. "Level 1", "Step 2", "SY0-701") — else null. */
  examLevel?: string | null;

  /** Normalized destination URL. Must be a real, public invite URL. */
  inviteUrl: string;

  /**
   * Real Discord guild (server) ID as returned by Discord's official API
   * (https://discord.com/api/v10/invites/<code>?with_counts=true). Factual
   * only — never guessed or inferred. Lets us dedupe communities that share
   * one guild across different invite codes.
   */
  discordGuildId?: string | null;

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

  /**
   * Consecutive strong-failure count from link checks (404/410 evidence).
   * Internal only — used to honor "first failure → unknown, repeated
   * strong evidence → dead". Never displayed.
   */
  linkCheckFailures?: number;

  /** Editorial placement only — never implies "best" or a rating. */
  featured?: boolean;

  /** Marks development/demo fixtures that must be removed before production. */
  isSample?: boolean;

  published: boolean;
}
