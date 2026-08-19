/**
 * Metadata normalization & sanitization for discovery output.
 *
 * All externally discovered text is UNTRUSTED. We store plain text only,
 * strip control characters, cap lengths, normalize tags, and never let
 * raw HTML/markdown through.
 */
import type { Community, CategorySlug } from '../../src/types/community';
import { normalizeInviteUrl } from '../../src/lib/urls';
import { slugifyTag, isCategorySlug } from '../../src/config/categories';
import { getExam } from '../../src/config/exams';
import type { ClassificationResult } from './classifyCommunity';
import type { ParsedCandidate } from '../discover/parseCandidates';

const MAX_DESCRIPTION = 400;
const MAX_TAGS = 8;
const MAX_EXAMS = 8;
const MAX_FAMILIES = 8;

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

/** Keep only exams that exist in config (the model never gets to invent slugs). */
function normalizeExams(exams: string[] | undefined): string[] {
  if (!exams) return [];
  const out: string[] = [];
  for (const slug of exams) {
    const clean = sanitizeText(slug, 60);
    if (!clean || !getExam(clean) || out.includes(clean)) continue;
    out.push(clean);
    if (out.length >= MAX_EXAMS) break;
  }
  return out;
}

/** Exam-family slugs derived strictly from evidenced exam slugs. */
function familiesFromExams(exams: string[]): string[] {
  const out: string[] = [];
  for (const slug of exams) {
    const family = getExam(slug)?.family;
    if (family && !out.includes(family)) out.push(family);
    if (out.length >= MAX_FAMILIES) break;
  }
  return out;
}

/**
 * Build a draft Community record from a candidate + classification.
 * Never fabricates: every field is either evidence-based or null/[]/unknown.
 */
export function buildCommunityDraft(
  candidate: ParsedCandidate,
  classification: ClassificationResult,
  anchorCategory: string
): Community {
  const now = new Date().toISOString();

  // Category: classification when it is a real exam-family slug, otherwise
  // the query's anchor family (the query was exam-specific by construction).
  const category: CategorySlug =
    classification.category && isCategorySlug(classification.category)
      ? classification.category
      : isCategorySlug(anchorCategory)
        ? anchorCategory
        : 'general-study';

  // Exams: only evidenced, config-valid exam slugs.
  const exams = normalizeExams(classification.exams);
  // Families: from evidenced exams; when none, the (evidence-anchored) category
  // itself is the honest family claim.
  const examFamilies = familiesFromExams(exams);
  if (examFamilies.length === 0) examFamilies.push(category);

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
    vertical: 'study-prep',
    category,
    subcategory: null,
    tags: normalizeTags(classification.tags),
    examFamilies: examFamilies.slice(0, MAX_FAMILIES),
    exams,
    targetMarkets: classification.targetMarkets ?? [],
    certificationProvider: classification.certificationProvider ?? null,
    studyTypes: classification.studyTypes ?? [],
    examLevel: classification.examLevel ?? null,
    inviteUrl: normalizeInviteUrl(candidate.candidateUrl) ?? candidate.candidateUrl,
    description,
    language: sanitizeText(classification.language, 40),
    country: null,
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