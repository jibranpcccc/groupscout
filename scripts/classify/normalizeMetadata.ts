/**
 * Metadata normalization & sanitization for discovery output.
 *
 * All externally discovered text is UNTRUSTED. We store plain text only,
 * strip control characters, cap lengths, normalize tags, and never let
 * raw HTML/markdown through.
 */
import type { Community } from '../../src/types/community';
import { normalizeInviteUrl } from '../../src/lib/urls';
import { slugifyTag } from '../../src/config/categories';
import type { ClassificationResult } from './classifyCommunity';
import type { ParsedCandidate } from '../discover/parseCandidates';

const MAX_DESCRIPTION = 400;
const MAX_TAGS = 8;

/** Remove C0 control characters without a regex (avoids lint no-control-regex). */
function stripControlChars(input: string): string {
  let out = '';
  for (const ch of input) {
    const code = ch.codePointAt(0) ?? 0;
    const isControl =
      (code >= 0x00 && code <= 0x08) ||
      code === 0x0b ||
      code === 0x0c ||
      (code >= 0x0e && code <= 0x1f) ||
      code === 0x7f;
    if (!isControl) out += ch;
  }
  return out;
}

export function sanitizeText(input: string | null | undefined, maxLength: number): string | null {
  if (!input) return null;
  const cleaned = stripControlChars(input)
    .replace(/<[^>]*>/g, ' ') // strip any HTML-ish markup
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return null;
  return cleaned.slice(0, maxLength);
}

export function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const tag = sanitizeText(raw, 40);
    if (!tag) continue;
    const slug = slugifyTag(tag);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push(tag);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

/**
 * Build a draft Community record from a candidate + classification.
 * Never fabricates: every field is either evidence-based or null/unknown.
 */
export function buildCommunityDraft(
  candidate: ParsedCandidate,
  classification: ClassificationResult,
  anchorCategory: string
): Community {
  const now = new Date().toISOString();

  const category =
    classification.category && ['crypto-web3', 'forex-stocks', 'ai-tech', 'online-earning', 'deals-coupons'].includes(classification.category)
      ? classification.category
      : anchorCategory;

  // Fallback title from the URL identifier when the model found no title.
  const fallbackTitle = candidate.candidateUrl
    .replace(/^https?:\/\//, '')
    .split('/')
    .filter(Boolean)
    .pop()
    ?.slice(0, 60);

  const title = sanitizeText(classification.title ?? fallbackTitle ?? candidate.platform, 140) ?? `${candidate.platform} community`;

  const description = sanitizeText(classification.description, MAX_DESCRIPTION);

  return {
    id: `cand-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    slug: candidate.suggestedSlug,
    title,
    platform: candidate.platform,
    category: category as Community['category'],
    subcategory: sanitizeText(classification.subcategory, 120),
    tags: normalizeTags(classification.tags),
    inviteUrl: normalizeInviteUrl(candidate.candidateUrl) ?? candidate.candidateUrl,
    description,
    language: sanitizeText(classification.language, 40),
    country: sanitizeText(classification.country, 40),
    accessType: classification.accessType,
    communityType: classification.communityType,
    memberCount: null,
    memberCountSource: null,
    memberCountCheckedAt: null,
    verificationStatus: 'unverified',
    linkStatus: 'unknown',
    lastCheckedAt: null,
    sourceUrls: [candidate.sourceUrl].filter(Boolean),
    discoveryMethod: 'gemini-search',
    discoveredAt: now,
    updatedAt: null,
    safetyFlags: [],
    featured: false,
    published: false,
  };
}

export { sanitizeText as sanitize };
