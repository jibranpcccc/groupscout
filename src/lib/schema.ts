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

export const communitySchema = z
  .object({
    id: z.string().min(3).max(64).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'id must be a lowercase slug'),
    slug: z.string().min(2).max(96).regex(SLUG_PATTERN, 'invalid slug format'),
    title: z.string().min(2).max(140, 'title too long'),
    platform: platformSchema,
    category: z.string().min(1).refine(isCategorySlug, { message: 'category not configured' }),
    subcategory: z.string().max(120).nullable().optional(),
    tags: z.array(z.string().min(1).max(40)).max(12).default([]),
    inviteUrl: z
      .string()
      .max(500)
      .refine(isHttpUrl, { message: 'inviteUrl must be a valid http(s) URL' }),
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
