/**
 * Rule-based (deterministic, zero-cost) classifier for discovery candidates.
 *
 * Runs BEFORE Gemini so obvious candidates never consume the free-tier
 * Gemini quota (15 req/min). Uses the SAME exam keyword registry as Gemini's
 * prompt (src/config/exams.ts), so it cannot contradict the LLM — it only
 * short-circuits the obvious cases:
 *
 *   - Evidence = candidateUrl + sourceUrl + snippet ONLY. The query anchor
 *     tag is deliberately EXCLUDED — it is query context, not candidate
 *     evidence (a "sat" query can return off-topic servers).
 *   - Exam keyword match → relevance=true with matched exam slug(s) + family.
 *   - No exam keyword but clear study-community signal → relevance=true,
 *     category=general-study (the hold-non-active step moves generic study
 *     out of pending; this tier just keeps them from being *rejected*).
 *   - No signal at all → null (caller falls through to Gemini).
 *
 * Evidence-based only — never guesses. Confidence is deliberately modest
 * (0.45-0.5) so results still need human review before publication.
 */
import { exams } from '../../src/config/exams';
import { examFamilies } from '../../src/config/examFamilies';
import type { ClassificationResult } from './classifyCommunity';
import type { ParsedCandidate } from '../discover/parseCandidates';

/** Word-boundary regex from a keyword (escaped, case-insensitive). */
function keywordRegex(keyword: string): RegExp {
  const escaped = keyword
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\s+');
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i');
}

/** Study-community signals (no specific exam) → general-study. */
const STUDY_SIGNALS = [
  /(?:^|[^a-z0-9])study(?:$|[^a-z0-9])/i,
  /exam (?:prep|preparation|tips|help|notes)/i,
  /(?:^|[^a-z0-9])prep(?:$|[^a-z0-9])/i,
  /practice (?:questions|tests|problems)/i,
  /revision|mock test|study group|study server|study together|study with me/i,
];

export interface RuleClassification {
  result: ClassificationResult;
  matchedKeyword: string;
  matchedExam: string;
}

/**
 * Try to classify a candidate deterministically from its OWN evidence text.
 * Returns null when no signal matches (caller falls through to Gemini).
 */
export function ruleBasedClassify(input: {
  candidate: ParsedCandidate;
}): RuleClassification | null {
  const candidate = input.candidate;
  const evidence = [candidate.candidateUrl ?? '', candidate.sourceUrl ?? '', candidate.evidence ?? '']
    .join(' ')
    .toLowerCase();

  const matchedExams: string[] = [];
  let matchedKeyword = '';
  let matchedExam = '';

  for (const exam of exams) {
    for (const kw of exam.keywords) {
      if (keywordRegex(kw).test(evidence)) {
        matchedExams.push(exam.slug);
        if (!matchedKeyword) {
          matchedKeyword = kw;
          matchedExam = exam.slug;
        }
        break; // one keyword per exam is enough
      }
    }
  }

  const uniqueExams = [...new Set(matchedExams)].slice(0, 8);

  let categoryValid: string | null = null;
  if (uniqueExams.length > 0) {
    const firstExam = exams.find((e) => e.slug === uniqueExams[0]);
    const family = firstExam?.family ?? null;
    categoryValid = family && examFamilies.some((f) => f.slug === family) ? family : null;
  } else if (STUDY_SIGNALS.some((re) => re.test(evidence))) {
    // Generic study community — relevant to the directory, no specific exam.
    matchedKeyword = '(study signal)';
    matchedExam = 'general-study';
    categoryValid = 'general-study';
  }

  if (!matchedKeyword) return null;

  // Title: prefer snippet-derived signal; else a readable URL-slug name.
  let title: string | null = null;
  if (candidate.evidence) {
    const firstSentence = candidate.evidence.split(/[.!?\n]/)[0]?.trim().slice(0, 120);
    if (firstSentence && firstSentence.length > 3) title = firstSentence;
  }
  if (!title && candidate.candidateUrl) {
    const slugPart = candidate.candidateUrl
      .replace(/^https?:\/\//, '')
      .split('/')
      .filter(Boolean)
      .pop();
    if (slugPart && slugPart.length > 2) {
      title = slugPart
        .replace(/[-_]+/g, ' ')
        .replace(/^(discord|t|telegram|whatsapp)\s+/i, '')
        .slice(0, 100);
    }
  }

  const result: ClassificationResult = {
    title,
    relevance: true,
    exams: uniqueExams,
    category: categoryValid,
    tags: uniqueExams.length > 0
      ? uniqueExams.map((slug) => {
          const e = exams.find((x) => x.slug === slug);
          return e ? e.name : slug;
        }).slice(0, 4)
      : ['study'],
    targetMarkets: [],
    studyTypes: ['discussion'],
    certificationProvider: null,
    examLevel: null,
    language: null,
    accessType: 'unknown',
    communityType: 'discussion',
    description: null, // no fabricated description
    confidence: uniqueExams.length > 0 ? 0.5 : 0.45,
  };

  return { result, matchedKeyword, matchedExam };
}
