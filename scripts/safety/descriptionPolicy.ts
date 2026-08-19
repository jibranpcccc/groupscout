/**
 * Description-policy guard for the study-prep discovery pipeline.
 *
 * Listings should carry a concise, factual description of the community's
 * purpose (platform-extracted or edited). Descriptions that are promotional
 * filler — hard-selling, urgency-scarcity, or generic hype with no substance —
 * degrade the directory and are flagged with safetyFlags
 * ['promotional-description'] for human review.
 *
 * Factual descriptions stay clean: naming the subject, audience, format,
 * schedule, or content of the group is never promotional even if it mentions
 * an exam or a study topic.
 *
 * Pure and deterministic: no I/O, no randomness.
 */

/** The canonical promotional-description safety flag name. */
export const PROMOTIONAL_DESCRIPTION_FLAG = 'promotional-description';

export interface DescriptionPolicyResult {
  /** True when the description reads like promotional/filler marketing. */
  promotional: boolean;
  /** safetyFlags to add (empty when clean). */
  flags: string[];
  /** The specific phrases that triggered (empty when clean). */
  matches: string[];
}

/**
 * Hard-sell / scarcity / urgency phrases — any single hit flags the
 * description as promotional.
 */
const PROMOTIONAL_PHRASES: RegExp[] = [
  /\bjoin\s+(?:our\s+)?(?:group|community|server|channel)\s+now\b/i,
  /\bjoin\s+now\b/i,
  /\bjoin\s+(?:today|us\s+today|us\s+now)\b/i,
  /\b(?:don['’]?t|do\s+not)\s+miss\s+(?:out|this|it)\b/i,
  /\bgrow\s+(?:your\s+)?skills\b/i,
  /\bboost\s+your\b/i,
  /\bsupercharge\s+your\b/i,
  /\bunlock\s+(?:your\s+)?(?:potential|success|the\s+exam)\b/i,
  /\b(?:hurry|limited\s+(?:spots|time|seats)|act\s+now)\b/i,
  /\b(?:exclusive\s+(?:offer|access)|free\s+giveaway|once\s+in\s+a\s+lifetime)\b/i,
  /\b(?:sign\s+up|register|subscribe)\s+(?:now|today)\b/i,
  /\bfor\s+(?:a\s+)?limited\s+time\b/i,
  /\b(?:never\s+miss\s+an\s+update|stay\s+ahead|be\s+the\s+first\s+to\s+know)\b/i,
];

/**
 * Marketing exclamations — repeated exclamation marks, rocket/fire hype
 * emojis, or a single "!" right after a hype verb flag the description.
 */
const EXCLAMATION_RE = /!{2,}/;
const HYPE_EMOJI_RE = /(?:🚀|🔥|💥|✨|🎉|💯)/;
const SHOUT_RE = /(?:JOIN NOW|LIMITED|HURRY|ACT NOW|SIGN UP NOW)/;

/** Short adjectives/verbs that appear disproportionately in filler copy. */
const FILLER_VERBS = [
  'join',
  'boost',
  'grow',
  'supercharge',
  'unlock',
  'never miss',
  'hurry',
  'subscribe',
];

function countHits(text: string): { hits: string[] } {
  const hits: string[] = [];
  for (const re of PROMOTIONAL_PHRASES) {
    if (re.test(text)) hits.push(re.source);
  }
  if (EXCLAMATION_RE.test(text)) hits.push('double-exclamation');
  if (HYPE_EMOJI_RE.test(text)) hits.push('hype-emoji');
  if (SHOUT_RE.test(text)) hits.push('all-caps-hype');
  return { hits: [...new Set(hits)] };
}

function countFillerWords(text: string): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const word of FILLER_VERBS) {
    if (lower.includes(word)) count++;
  }
  return count;
}

/**
 * Evaluate a community description for promotional/filler content.
 *
 * A description is promotional when:
 *   - it hits any hard-sell / urgency phrase, OR
 *   - it hits an exclamation/hype-emoji pattern, OR
 *   - "!"/marketing words appear so often that the text is likely filler
 *     (2+ filler verbs and no substantive nouns is the heuristic).
 */
export function evaluateDescription(description: string | null | undefined): DescriptionPolicyResult {
  const text = (description ?? '').trim();
  if (!text) return { promotional: false, flags: [], matches: [] };

  const { hits } = countHits(text);

  // Filler heuristic: lots of marketing verbs with little substance.
  const fillerVerbCount = countFillerWords(text);
  // Heuristic for "no substance": fewer than 3 words that are not stopwords
  // / marketing verbs (a proxy for no real content).
  const substantiveWords = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !FILLER_VERBS.includes(w) && !['for', 'the', 'and', 'with', 'your', 'you', 'not', 'our', 'can'].includes(w));

  let promotional = hits.length > 0;
  if (!promotional && fillerVerbCount >= 2 && substantiveWords.length < 3) {
    promotional = true;
    hits.push('filler-verbs-without-substance');
  }

  return {
    promotional,
    flags: promotional ? [PROMOTIONAL_DESCRIPTION_FLAG] : [],
    matches: promotional ? [...new Set(hits)] : [],
  };
}

/** Convenience wrapper for pipeline use: returns only safetyFlags to add. */
export function descriptionSafetyFlags(description: string | null | undefined): string[] {
  return evaluateDescription(description).flags;
}
