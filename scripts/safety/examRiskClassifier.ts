/**
 * Exam-risk language classifier for the study-prep discovery pipeline.
 *
 * Classifies candidate evidence text into three levels:
 *   - 'high-risk-reject' — clear exam-integrity violations (leaked questions,
 *     real exam dumps, braindumps, proxy test takers, buying certificates,
 *     stolen materials, credential fraud, impersonation). These are
 *     auto-rejected by the discovery pipeline and logged — never pending.
 *   - 'risk-flagged' — language that warrants human review (guaranteed
 *     questions, exam leaks, answer keys, paper leaks, generic dump talk).
 *     The pipeline routes these to pending WITH safetyFlags:
 *     ['exam-risk-language'].
 *   - 'clean' — legitimate study support (practice questions, mock exams,
 *     study notes, official sample tests, flashcards, peer quizzes). Never
 *     flagged.
 *
 * Multi-word patterns use word boundaries on the collapsed, normalized text
 * so "certificate" in "CISSP certificate study" never trips "buy certificate".
 *
 * Pure and deterministic: no I/O, no randomness.
 */

export type ExamRiskLevel = 'clean' | 'risk-flagged' | 'high-risk-reject';

export interface ExamRiskResult {
  level: ExamRiskLevel;
  /** Human-readable flag names for every pattern that matched. */
  flags: string[];
}

export interface ExamRiskPattern {
  flag: string;
  pattern: RegExp;
}

/**
 * HIGH-RISK signals — auto-reject. A single match is enough to reject:
 * these phrases describe exam-fraud services, not study support.
 */
export const HIGH_RISK_PATTERNS: ExamRiskPattern[] = [
  { flag: 'leaked-exam-questions', pattern: /\bleaked\s+(?:exam\s+)?questions?\b/i },
  { flag: 'leaked-exam-questions', pattern: /\b(?:exam|test)\s+questions?\s+leaked\b/i },
  // A bare "leaked exam/test" describes circulating the actual exam content
  // (as opposed to "paper leak"/"exam leaks" talk, which stays risk-flagged).
  { flag: 'leaked-exam-content', pattern: /\bleaked\s+(?:exam|test)\b/i },
  {
    flag: 'real-exam-questions',
    pattern: /\b(?:real|actual|original|genuine|authentic)\s+(?:exam|test)\s+questions?\b/i,
  },
  { flag: 'real-exam-dumps', pattern: /\b(?:real|actual|original|genuine|authentic)\s+exam\s+dumps?\b/i },
  { flag: 'braindumps', pattern: /\bbrain[- ]?dumps?\b/i },
  {
    flag: 'proxy-test-taker',
    pattern: /\b(?:someone|we|they|i|he|she|pros?|experts?)\s+will\s+(?:take|write|sit)\s+(?:your|my|our)\s+[a-z-]+\s+exam\b/i,
  },
  {
    flag: 'proxy-test-taker',
    pattern: /\b(?:proxy\s+test[- ]?taker|take\s+my\s+exam|do\s+my\s+exam|take\s+(?:the\s+)?(?:your\s+)?exam\s+for\s+you|sit\s+the\s+exam\s+for\s+you|exam\s+for\s+you\s+while\s+you|exam\s+proxy)\b/i,
  },
  {
    flag: 'pay-for-certificate',
    pattern: /\b(?:buy\s+certificates?|pay\s+for\s+certificates?|pay\s+certificates?|certificates?\s+without\s+(?:taking\s+)?(?:the\s+)?exam|buy\s+a\s+certificate|cheap\s+certificates?)\b/i,
  },
  { flag: 'stolen-test-materials', pattern: /\b(?:stolen\s+(?:test|exam)\s+materials?|stolen\s+(?:exam\s+)?questions?)\b/i },
  {
    // "Recalls" (esp. USMLE/medical/bar) = actual exam questions reconstructed
    // from memory after sitting the exam — an explicit exam-integrity
    // violation. USMLE/NBME and most licensing bodies prohibit it outright.
    flag: 'exam-recalls',
    pattern: /\b(?:usmle|step\s*\d|nbme|cbse|ccse|shelf|bar\s+exam|medical\s+boards?|licensing\s+exam)\b[^\n]{0,80}\brecall(?:s|ed|ing)?\b|\brecall(?:s|ed|ing)?\b[^\n]{0,40}\b(?:usmle|step\s*\d|nbme|cbse|ccse|shelf|bar\s+exam|medical\s+boards?)\b/i,
  },
  {
    flag: 'credential-fraud',
    pattern: /\b(?:credential\s+fraud|fake\s+certificates?|forg(?:e|ed)\s+certificates?|buy\s+verified\s+certificates?|fraudulent\s+certificates?)\b/i,
  },
  {
    flag: 'impersonation',
    pattern: /\b(?:exam\s+impersonation|impersonat\w+\s+(?:taker|service|help)|take\s+the\s+exam\s+instead\s+of\s+you)\b/i,
  },
];

/**
 * RISK-FLAGGED signals — pending + safetyFlags, human review decides.
 * These suggest (but do not prove) questionable sourcing; legitimate
 * practice communities occasionally mention answer keys, so they must
 * never auto-reject.
 */
export const RISK_FLAG_PATTERNS: ExamRiskPattern[] = [
  { flag: 'guaranteed-questions', pattern: /\bguaranteed\s+(?:exam\s+)?questions?\b/i },
  { flag: 'exam-leaks', pattern: /\b(?:exam\s+leaks?|leaked\s+exam\b)\b/i },
  { flag: 'answer-keys', pattern: /\banswer\s+keys?\b/i },
  { flag: 'paper-leaks', pattern: /\b(?:paper\s+leaks?|question\s+paper\s+leaks?|leaked\s+(?:question\s+)?papers?)\b/i },
  { flag: 'exam-dumps-talk', pattern: /\bexam\s+dumps?\b/i },
];

interface CompiledRiskPattern {
  flag: string;
  pattern: RegExp;
}

const HIGH_RISK_COMPILED: CompiledRiskPattern[] = HIGH_RISK_PATTERNS.map((p) => ({
  flag: p.flag,
  pattern: p.pattern,
}));

const RISK_FLAG_COMPILED: CompiledRiskPattern[] = RISK_FLAG_PATTERNS.map((p) => ({
  flag: p.flag,
  pattern: p.pattern,
}));

function collectMatches(compiled: CompiledRiskPattern[], text: string): string[] {
  const flags: string[] = [];
  for (const rule of compiled) {
    if (rule.pattern.test(text)) flags.push(rule.flag);
  }
  return flags;
}

/**
 * Classify evidence text against the exam-risk rule set.
 * High-risk matches always win: a candidate saying "leaked exam questions"
 * is rejected even if it also mentions "practice questions".
 */
export function classifyExamRisk(text: string): ExamRiskResult {
  const haystack = text ?? '';
  const highRisk = collectMatches(HIGH_RISK_COMPILED, haystack);
  const flagged = collectMatches(RISK_FLAG_COMPILED, haystack);

  if (highRisk.length > 0) {
    return { level: 'high-risk-reject', flags: [...highRisk, ...flagged] };
  }
  if (flagged.length > 0) {
    return { level: 'risk-flagged', flags: flagged };
  }
  return { level: 'clean', flags: [] };
}

/** True when every flag on the result is from the pending-review tier. */
export function isRiskFlagged(result: ExamRiskResult): boolean {
  return result.level === 'risk-flagged';
}

export function isHighRiskReject(result: ExamRiskResult): boolean {
  return result.level === 'high-risk-reject';
}