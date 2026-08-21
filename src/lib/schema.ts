import { z } from 'zod';
import { isCategorySlug } from '../config/categories';
import { isPlatformId } from '../config/platforms';
import { isHttpUrl } from './urls';
import { isValidIsoDate } from './dates';

/**
 * Runtime schema validation for community records and datasets.
 * Raw JSON is never trusted — the build fails on malformed production data.
 */

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const verificationStatusSchema = z.enum([
  'unverified',
  'source-confirmed',
  'owner-confirmed',
  'manually-reviewed',
]);

export const linkStatusSchema = z.enum(['active', 'unknown', 'dead', 'removed', 'reported']);

export const platformSchema = z.enum(['telegram', 'whatsapp', 'discord']);

export const targetMarketSchema = z.enum(['US', 'UK', 'CA', 'AU', 'NZ', 'IE', 'global-english']);

export const studyTypeSchema = z.enum([
  'discussion',
  'study-group',
  'practice-questions',
  'accountability',
  'resources',
  'exam-strategy',
  'peer-support',
]);

/**
 * True when a memberCountSource is the ACTUAL platform evidence that backs a
 * member count:
 *   - Discord API invite response (discord.com/api/... or discord.com/discord.gg)
 *   - a public Telegram channel preview (t.me/... or telegram.me/...)
 * Anything else — an unrelated external website — is not acceptable evidence
 * for a member number. See the memberCount superRefine below.
 */
const MEMBER_COUNT_EVIDENCE_HOSTS = new Set([
  'discord.com',
  'discord.gg',
  'discordapp.com',
  't.me',
  'telegram.me',
  'telegram.dog',
]);

export function isPlatformEvidenceSource(value: string): boolean {
  if (!isHttpUrl(value)) return false;
  try {
    const host = new URL(value).hostname.toLowerCase().replace(/^www\./, '');
    return (
      MEMBER_COUNT_EVIDENCE_HOSTS.has(host) ||
      [...MEMBER_COUNT_EVIDENCE_HOSTS].some((h) => host.endsWith(`.${h}`))
    );
  } catch {
    return false;
  }
}

export const communitySchema = z
  .object({
    id: z.string().min(3).max(64).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'id must be a lowercase slug'),
    slug: z.string().min(2).max(96).regex(SLUG_PATTERN, 'invalid slug format'),
    title: z.string().min(2).max(140, 'title too long'),
    platform: platformSchema,
    // The directory's single vertical. A record without this cannot be
    // schema-valid, and findProductionViolations rejects non-study-prep
    // published records at the dataset level.
    vertical: z.literal('study-prep'),
    category: z.string().min(1).refine(isCategorySlug, { message: 'category not configured' }),
    subcategory: z.string().max(120).nullable().optional(),
    tags: z.array(z.string().min(1).max(40)).max(12).default([]),
    examFamilies: z.array(z.string().min(1).max(40)).max(8).default([]),
    exams: z.array(z.string().min(1).max(40)).max(8).default([]),
    targetMarkets: z.array(targetMarketSchema).max(8).default([]),
    certificationProvider: z.string().max(80).nullable().optional(),
    studyTypes: z.array(studyTypeSchema).max(8).default([]),
    examLevel: z.string().max(40).nullable().optional(),
    inviteUrl: z
      .string()
      .max(500)
      .refine(isHttpUrl, { message: 'inviteUrl must be a valid http(s) URL' }),
    discordGuildId: z.string().max(32).nullable().optional(),
    description: z
      .string()
      .max(400, 'description too long (max 400 chars)')
      .nullable()
      .optional(),
    language: z.string().max(40).nullable().optional(),
    country: z.string().max(40).nullable().optional(),
    accessType: z.enum(['free', 'paid', 'mixed', 'unknown']).optional(),
    communityType: z
      .enum(['discussion', 'education', 'signals', 'news', 'jobs', 'deals', 'support', 'other', 'unknown'])
      .optional(),
    memberCount: z.number().int().nonnegative().nullable().optional(),
    memberCountSource: z.string().max(500).nullable().optional(),
    memberCountCheckedAt: z.string().nullable().optional(),
    verificationStatus: verificationStatusSchema,
    linkStatus: linkStatusSchema,
    lastCheckedAt: z.string().nullable().optional(),
    sourceUrls: z.array(z.string().max(500).refine(isHttpUrl, 'source URL must be http(s)')).default([]),
    discoveryMethod: z.enum(['gemini-search', 'manual', 'user-submission', 'platform-api', 'other']),
    discoveredAt: z.string().refine(isValidIsoDate, { message: 'discoveredAt must be an ISO date' }),
    updatedAt: z.string().nullable().optional(),
    safetyFlags: z.array(z.string().max(80)).max(10).optional(),
    linkCheckFailures: z.number().int().nonnegative().max(10).optional(),
    featured: z.boolean().optional(),
    isSample: z.boolean().optional(),
    published: z.boolean(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.memberCount != null) {
      if (!data.memberCountSource || !isValidIsoDate(data.memberCountCheckedAt)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['memberCount'],
          message: 'memberCount requires memberCountSource and memberCountCheckedAt',
        });
        return;
      }
      // memberCountSource must point at the ACTUAL platform evidence (the
      // Discord API invite response or a public Telegram channel preview) —
      // never an unrelated external website. This keeps the number traceable
      // to the platform that hosts the community.
      if (!isPlatformEvidenceSource(data.memberCountSource)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['memberCountSource'],
          message:
            'memberCountSource must be the platform evidence (Discord API invite or public Telegram preview), not an unrelated website',
        });
      }
    }
  });

export type CommunityRecord = z.infer<typeof communitySchema>;

export interface DatasetValidationResult {
  ok: boolean;
  errors: string[];
  publishedCount: number;
  pendingCount: number;
}

/**
 * Validate a whole dataset file (list of communities) plus cross-record
 * invariants: unique ids, unique normalized invite URLs, valid platform
 * values, and (when provided) no overlap between published and pending.
 */
export function validateDataset(
  published: unknown[],
  pending: unknown[] = []
): DatasetValidationResult {
  const errors: string[] = [];

  const seenIds = new Map<string, string>();
  const seenInviteKeys = new Map<string, string>();

  const checkRecord = (record: unknown, fileLabel: string, index: number): void => {
    const result = communitySchema.safeParse(record);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const path = issue.path.join('.') || '(root)';
        errors.push(`[${fileLabel} #${index}] ${path}: ${issue.message}`);
      }
      return;
    }
    const c = result.data;

    if (seenIds.has(c.id)) {
      errors.push(`[${fileLabel} #${index}] duplicate id "${c.id}" (also in ${seenIds.get(c.id)})`);
    } else {
      seenIds.set(c.id, fileLabel);
    }

    if (c.platform && !isPlatformId(c.platform)) {
      errors.push(`[${fileLabel} #${index}] invalid platform "${c.platform}"`);
    }

    const key = `${c.platform}:${c.inviteUrl.toLowerCase()}`;
    if (seenInviteKeys.has(key)) {
      errors.push(
        `[${fileLabel} #${index}] duplicate invite URL "${c.inviteUrl}" (also in ${seenInviteKeys.get(key)})`
      );
    } else {
      seenInviteKeys.set(key, fileLabel);
    }
  };

  published.forEach((record, i) => checkRecord(record, 'groups.json', i));
  pending.forEach((record, i) => checkRecord(record, 'pending-groups.json', i));

  return {
    ok: errors.length === 0,
    errors,
    publishedCount: published.length,
    pendingCount: pending.length,
  };
}

/**
 * PRODUCTION SAFETY GUARD — sample/demo content must never reach production.
 *
 * Fails for any record that is (or looks like) a development fixture:
 * - `isSample === true` (published or pending)
 * - example.com (or any non-production placeholder host) invite URL
 * - example.com in sourceUrls
 * - "(Demo)" in the title
 * - "Demo fixture" in the description
 *
 * `npm run validate-data` and CI fail when this returns violations, so demo
 * data can never be built or deployed again.
 */
const DEMO_HOSTS = new Set(['example.com', 'example.org', 'example.net', 'localhost', '127.0.0.1']);

export interface ProductionViolation {
  id: string;
  reason: string;
}

export function findProductionViolations(records: unknown[]): ProductionViolation[] {
  const violations: ProductionViolation[] = [];
  for (const record of records) {
    const c = record as Partial<CommunityRecord>;
    const id = c.id ?? '(unknown id)';
    // Node 18+ provides a global URL — declared for eslint's no-undef.
    /* global URL */
    const urlHost = (() => {
      try {
        return new URL(c.inviteUrl ?? '').hostname.toLowerCase().replace(/^www\./, '');
      } catch {
        return '';
      }
    })();

    if (c.isSample === true) {
      violations.push({ id, reason: 'isSample === true (demo fixture in production data)' });
    }
    if (c.published && c.inviteUrl && DEMO_HOSTS.has(urlHost)) {
      violations.push({ id, reason: `inviteUrl hostname "${urlHost}" is a placeholder/demo host` });
    }
    if (c.published && c.sourceUrls?.some((u) => DEMO_HOSTS.has(hostOf(u)))) {
      violations.push({ id, reason: 'sourceUrls contain a placeholder/demo host' });
    }
    if (c.published && c.title?.toLowerCase().includes('(demo)')) {
      violations.push({ id, reason: 'title contains "(Demo)"' });
    }
    if (c.published && c.description?.toLowerCase().includes('demo fixture')) {
      violations.push({ id, reason: 'description contains "Demo fixture"' });
    }
    // CONTENT CLEANLINESS GUARD: no scraped artifacts, telescope CDN URLs, download banners, or gibberish
    const GIBBERISH_PATTERNS = [
      /telescope/i,
      /cdn\d?\.telesco\.pe/i,
      /telegram\.org\/dl/i,
      /\[Download\]/i,
      /Download\(/i,
      /\b(akshfd|asdfgh|qwertyuiop|lorem ipsum|test123|foobar)\b/i,
      /\d+[KkMm]?\s+subscribers/i,
    ];
    if (c.published && c.title) {
      for (const pat of GIBBERISH_PATTERNS) {
        if (pat.test(c.title)) {
          violations.push({ id, reason: `title contains forbidden pattern ${pat.toString()}: "${c.title}"` });
          break;
        }
      }
      if (c.title.startsWith('http://') || c.title.startsWith('https://')) {
        violations.push({ id, reason: `title cannot be a raw URL: "${c.title}"` });
      }
    }
    if (c.published && c.slug) {
      if (c.slug.includes('telescope') || c.slug.includes('download') || c.slug.includes('subscribers')) {
        violations.push({ id, reason: `slug contains forbidden scraped pattern: "${c.slug}"` });
      }
    }
    if (c.published && c.description) {
      if (c.description.includes('![](http') || c.description.includes('cdn.telesco.pe') || c.description.includes('[Download]')) {
        violations.push({ id, reason: `description contains raw scraped markdown or CDN URL: "${c.description.slice(0, 40)}..."` });
      }
    }
    // NICHE GUARD: every published record must belong to the study-prep
    // vertical. Old-niche records (crypto/forex/jobs/deals/gaming) can never
    // return to production.
    if (c.published && c.vertical !== 'study-prep') {
      violations.push({ id, reason: `vertical is "${String(c.vertical ?? 'missing')}" — expected "study-prep"` });
    }
  }
  return violations;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}
