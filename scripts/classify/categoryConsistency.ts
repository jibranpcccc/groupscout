/**
 * Deterministic category-consistency enforcement for discovery output —
 * study-prep niche.
 *
 * The LLM classifier occasionally buckets a community under the wrong
 * exam-family category (or leaves it null). This module applies fixed,
 * rule-based keyword signals to the classified text (title + description +
 * tags) and overrides the category ONLY on a strong signal: at least
 * STRONG_SIGNAL_THRESHOLD keyword hits from the same exam family. Weak or
 * ambiguous signals leave the original category untouched, and records
 * whose category already matches the detected one are reported unchanged.
 *
 * Rules are DERIVED from src/config/exams.ts + src/config/examFamilies.ts:
 * each family's rules = family name + family tags + every keyword of every
 * exam in that family. Adding an exam or family updates the fixer
 * automatically — no hand-maintained category lists.
 *
 * Pure and side-effect free: no I/O, no randomness — fully deterministic.
 */
import { getExam } from '../../src/config/exams';
import { examFamilies } from '../../src/config/examFamilies';

export interface CategoryFixInput {
  title?: string | null;
  description?: string | null;
  tags?: string[] | null;
  category?: string | null;
}

export interface CategoryFixResult {
  category: string | null;
  changed: boolean;
  reason?: string;
}

export interface CategoryKeywordRule {
  category: string;
  keywords: string[];
}

/** Minimum keyword hits from a single family before an override applies. */
export const STRONG_SIGNAL_THRESHOLD = 2;

/** Unique, deduped keywords contributing to each family rule. */
function familyKeywords(familyName: string, familyTags: string[], examSlugs: string[]): string[] {
  const words: string[] = [];
  const seen = new Set<string>();
  const push = (word: string): void => {
    const key = word.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      words.push(word);
    }
  };
  push(familyName);
  for (const tag of familyTags) push(tag);
  for (const slug of examSlugs) {
    const exam = getExam(slug);
    if (exam) for (const kw of exam.keywords) push(kw);
  }
  return words;
}

/**
 * Keyword rules, in family order (on a tie the first rule wins, keeping
 * the fixer deterministic — config order, so English Proficiency's "oet"
 * stays with english-proficiency unless a more specific medical term hits).
 */
export const CATEGORY_KEYWORD_RULES: CategoryKeywordRule[] = examFamilies.map((family) => ({
  category: family.slug,
  keywords: familyKeywords(family.name, family.tags, family.exams),
}));

/** Lowercase and collapse every non-alphanumeric run to a single space. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

interface CompiledRule {
  category: string;
  keywords: string[];
  patterns: RegExp[];
}

/**
 * Precompile one word-boundary pattern per keyword. Both the keyword and
 * the haystack are normalized (lowercase, punctuation collapsed to single
 * spaces), so `\b` boundaries equal real word boundaries and short
 * keywords like "ai" never match inside words such as "email" or "said".
 */
const COMPILED_RULES: CompiledRule[] = CATEGORY_KEYWORD_RULES.map((rule) => ({
  category: rule.category,
  keywords: rule.keywords,
  patterns: rule.keywords.map((keyword) => {
    const normalizedKeyword = normalize(keyword);
    const spacedKeyword = normalizedKeyword.replace(/ /g, '\\s+');
    return new RegExp(`\\b${spacedKeyword}\\b`, 'g');
  }),
}));

/**
 * Enforce category consistency on a classified record.
 *
 * Counts keyword hits from the same exam family across title + description +
 * tags and, on a strong signal (>= STRONG_SIGNAL_THRESHOLD hits from one
 * family), overrides the category. Otherwise the original category is
 * kept. `changed` is false whenever the category is left as-is — including
 * when the detected category already equals the original.
 */
export function enforceCategoryConsistency(record: CategoryFixInput): CategoryFixResult {
  const originalCategory = record.category ?? null;

  const haystack = [record.title, record.description, ...(record.tags ?? [])]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .map(normalize)
    .filter(Boolean)
    .join(' ');

  if (!haystack) {
    return { category: originalCategory, changed: false };
  }

  // STUDY-SIGNAL GUARD: category overrides are only applied to communities
  // that are EXPLICITLY study/exam focused. A general professional or
  // interest group (e.g. "cybersecurity professionals") must never be
  // reclassified as an exam-study community just because keywords overlap.
  const STUDY_SIGNAL =
    /\b(stud(y|ying|ies|ied)|exams?|prep(aration|aring)?|practice questions?|mock (exam|test)|flashcards?|certifications?|test (prep|preparation)|revision|syllabus|study (group|session|partner|community)|question bank|exam strategy|pass the exam)\b/;
  if (!STUDY_SIGNAL.test(haystack)) {
    return { category: originalCategory, changed: false };
  }

  let bestCategory: string | null = null;
  let bestHits = 0;
  let bestKeywords: string[] = [];

  for (const rule of COMPILED_RULES) {
    let hits = 0;
    const hitKeywords: string[] = [];
    for (let i = 0; i < rule.patterns.length; i++) {
      const count = haystack.match(rule.patterns[i])?.length ?? 0;
      if (count > 0) hitKeywords.push(rule.keywords[i]);
      hits += count;
    }
    // Strictly greater keeps the first (highest-priority) rule on ties.
    if (hits > bestHits) {
      bestHits = hits;
      bestCategory = rule.category;
      bestKeywords = hitKeywords;
    }
  }

  if (bestHits < STRONG_SIGNAL_THRESHOLD || bestCategory === null) {
    return { category: originalCategory, changed: false };
  }

  if (bestCategory === originalCategory) {
    return { category: originalCategory, changed: false };
  }

  const reason = `${bestHits} keyword hit${bestHits === 1 ? '' : 's'} (${bestKeywords.join(', ')})`;
  return { category: bestCategory, changed: true, reason };
}