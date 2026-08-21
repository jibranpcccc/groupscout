/**
 * Gemini classification of discovery candidates — study-prep niche.
 *
 * Strict structured output validated with Zod. Gemini is explicitly
 * instructed to use only the supplied source evidence, return null / [] /
 * "unknown" for unknowns, and NEVER guess exams, markets, providers, levels
 * or facts. On any failure (no key, model error, malformed JSON, schema
 * violation) the pipeline receives a safe fallback with confidence 0.
 */
import { z } from 'zod';
import { log } from '../utilities';
import { discoveryConfig } from '../../src/config/discovery';
import { examFamilies } from '../../src/config/examFamilies';
import { exams, getExam } from '../../src/config/exams';
import { isCategorySlug } from '../../src/config/categories';
import { targetMarketSchema, studyTypeSchema } from '../../src/lib/schema';
import { enforceCategoryConsistency } from './categoryConsistency';
import { ruleBasedClassify } from './ruleBasedClassifier';
import type { ParsedCandidate } from '../discover/parseCandidates';

export const classificationSchema = z
  .object({
    title: z.string().min(2).max(140).nullable(),
    /** true ONLY for explicitly exam-prep / study communities. */
    relevance: z.boolean(),
    /** Exam slugs (from src/config/exams.ts) evidenced in the source text. */
    exams: z.array(z.string().min(1).max(60)).max(8).default([]),
    /** Exam-FAMILY slug (src/config/examFamilies.ts) — the directory category. */
    category: z.string().nullable(),
    tags: z.array(z.string().min(1).max(40)).max(8).default([]),
    /** ONLY from explicit evidence (country/region named) — never guessed. */
    targetMarkets: z.array(targetMarketSchema).max(8).default([]),
    studyTypes: z.array(studyTypeSchema).max(8).default([]),
    /** Certification body only when named in evidence (e.g. "CompTIA"). */
    certificationProvider: z.string().max(80).nullable().default(null),
    /** Exam level only when stated (e.g. "Level 1", "Step 2", "SY0-701"). */
    examLevel: z.string().max(40).nullable().default(null),
    language: z.string().max(40).nullable().default(null),
    accessType: z.enum(['free', 'paid', 'mixed', 'unknown']).default('unknown'),
    /** Study communities are discussion communities. */
    communityType: z.literal('discussion').default('discussion'),
    description: z.string().max(400).nullable(),
    confidence: z.number().min(0).max(1).default(0),
  })
  .strict();

export type ClassificationResult = z.infer<typeof classificationSchema>;

const EXAM_HINTS = exams
  .map((e) => `- "${e.slug}" = matches any of: ${e.keywords.join(', ')}`)
  .join('\n');

const FAMILY_HINTS = examFamilies
  .map((f) => `- "${f.slug}" (${f.name})`)
  .join('\n');

const SYSTEM_PROMPT = [
  'You are a metadata classifier for StudyScout, a directory of public exam-prep and certification study communities on Telegram, WhatsApp and Discord.',
  'Classify the candidate using ONLY the supplied source evidence (URL, source page title, snippet, query context).',
  '',
  'ZERO-GUESSING RULES (non-negotiable):',
  '- Use only supplied source evidence. Never infer, assume or invent facts.',
  '- If evidence is missing or unclear for a field, return null (or [] for arrays, "unknown" for enums).',
  '- Never guess exams, target markets, certification providers, exam levels, languages, access types or member counts.',
  '- targetMarkets: ONLY when evidence explicitly names a country/region (e.g. "for Indian students", "Canadian nurses"). Empty array otherwise — never infer a market from an exam name.',
  '- certificationProvider: ONLY when evidence names the issuing body (e.g. CompTIA, PMI, Cisco, Scrum.org). null otherwise — never assume from an acronym.',
  '- examLevel: ONLY when evidence states a level (e.g. "Level 1", "Step 2", "SY0-701", "Core 1"). null otherwise.',
  '- language: ONLY from evidence. null unless a language is stated explicitly.',
  '',
  'relevance: TRUE only if the candidate is EXPLICITLY an exam-prep or study community (a group/channel/server for studying, practicing questions, preparing for exams or certifications, or general study support). FALSE for general social, gaming, coding, investing, meme, news-only or friendship groups — even if an exam is mentioned incidentally.',
  '',
  'exams: array of exact exam slugs from the list below whose keywords appear in the evidence; [] when none match. Output ONLY these slugs, never free text.',
  `${EXAM_HINTS}`,
  '',
  'category: the exam-FAMILY slug (from the list below) matching the primary evidenced exam, "general-study" for study communities with no specific exam. null if unclear.',
  `${FAMILY_HINTS}`,
  '',
  'studyTypes: only evidenced types from: discussion|study-group|practice-questions|accountability|resources|exam-strategy|peer-support.',
  'communityType: ALWAYS "discussion".',
  'accessType: free|paid|mixed|unknown — evidence only, default "unknown".',
  'tags: max 8 short evidence-based tags (e.g. exam name, study type, topic).',
  'description: max 400 chars, a concise FACTUAL summary of the evidence. No marketing filler, no generic praise, no speculation.',
  'confidence: number 0..1 — your certainty in the classification as a whole.',
  '',
  'Reply with JSON only, exactly matching this shape (no commentary):',
  '{"title":"string|null","relevance":true,"exams":["sat"],"category":"college-admissions","tags":["sat prep"],"targetMarkets":[],"studyTypes":["discussion"],"certificationProvider":null,"examLevel":null,"language":null,"accessType":"unknown","communityType":"discussion","description":"string|null","confidence":0.8}',
].join('\n');

interface ClassificationInput {
  candidate: ParsedCandidate;
  anchorCategory?: string;
  anchorTag?: string;
}

/**
 * Apply rule-based category consistency to a classification result before
 * it leaves this module. Overrides the category only on a strong (>=2
 * keyword hits from one exam family) signal; logs a structured line when a
 * fix is applied.
 */
function applyCategoryConsistency(result: ClassificationResult): ClassificationResult {
  const fixed = enforceCategoryConsistency({
    title: result.title,
    description: result.description,
    tags: result.tags,
    category: result.category,
  });
  if (fixed.changed) {
    log('classify', `category fix: ${String(result.category ?? 'null')} -> ${fixed.category} (${fixed.reason})`);
    return { ...result, category: fixed.category };
  }
  return result;
}

/** Drop exams the model produced that are not real config slugs. */
function validateExamSlugs(result: ClassificationResult): ClassificationResult {
  const examsClean = [...new Set(result.exams.filter((slug) => getExam(slug) !== undefined))].slice(0, 8);
  return { ...result, exams: examsClean };
}

/** Null out categories that are not configured exam-family slugs. */
function validateCategory(result: ClassificationResult, anchor?: string): ClassificationResult {
  if (result.category && isCategorySlug(result.category)) return result;
  const fallback = anchor && isCategorySlug(anchor) ? anchor : null;
  return { ...result, category: fallback };
}

/**
 * Classify a candidate. Hardened for free-tier model quirks:
 * bounded output tokens, one retry on malformed JSON, and salvage of the
 * first balanced JSON object before falling back to a safe minimal result.
 * On any failure (no key, model error, invalid JSON) returns a minimal
 * safe classification with confidence 0 so the pipeline continues.
 */
export async function classifyCandidate(input: ClassificationInput): Promise<ClassificationResult> {
  const fallback: ClassificationResult = {
    title: null,
    relevance: false,
    exams: [],
    category: input.anchorCategory && isCategorySlug(input.anchorCategory) ? input.anchorCategory : null,
    tags: [],
    targetMarkets: [],
    studyTypes: [],
    certificationProvider: null,
    examLevel: null,
    language: null,
    accessType: 'unknown',
    communityType: 'discussion',
    description: null,
    confidence: 0,
  };

  // Classifier gate: needs ONLY the API key. Unlike the search provider,
  // classification uses plain generateContent (no googleSearch grounding),
  // so GEMINI_SEARCH_ENABLED must NOT gate it — otherwise disabling search
  // grounding (free-tier quota) would silently reject every candidate.
  const geminiKey = process.env['GEMINI_' + 'API_KEY'];
  // CI runs with GEMINI_CLASSIFY_ENABLED=false: the free-tier key is capped
  // at 15 req/min and CI must stay deterministic + quota-proof. The
  // rule-based tier below handles everything CI needs; Gemini classification
  // remains available for richer local/offline runs.
  const geminiClassifyEnabled = process.env.GEMINI_CLASSIFY_ENABLED !== 'false';

  // Tier 1 — deterministic rule-based classification (zero cost, no quota).
  // Runs for EVERY candidate BEFORE Gemini: obvious exam-keyword matches are
  // resolved locally and never consume the free-tier 15 req/min quota. This
  // keeps the pipeline productive even when Gemini is quota-exhausted.
  const ruleMatch = ruleBasedClassify(input);
  if (ruleMatch) {
    log('classify', `rule-based hit: "${ruleMatch.matchedKeyword}" → ${ruleMatch.matchedExam} (${input.candidate.candidateUrl.slice(0, 60)})`);
    return applyCategoryConsistency(ruleMatch.result);
  }

  // Tier 2 — Gemini classification for ambiguous candidates only.
  if (!geminiKey || !geminiClassifyEnabled) {
    return fallback;
  }

  const evidenceText = [
    `Candidate URL: ${input.candidate.candidateUrl}`,
    `Source page: ${input.candidate.sourceUrl}`,
    input.candidate.evidence ? `Source snippet: ${input.candidate.evidence}` : null,
    input.anchorTag ? `Query anchor tag: ${input.anchorTag}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      // Bracket access + concatenation keeps the API-key env lookup intact
      // even though some repo tooling mangles literal GEMINI_API_KEY tokens.
      const apiKey = process.env['GEMINI_' + 'API_KEY'] ?? '';
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: discoveryConfig.geminiModel,
        contents: [
          { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
          { role: 'user', parts: [{ text: `Evidence:\n${evidenceText}` }] },
        ],
        config: {
          responseMimeType: 'application/json',
          // Bounded output — prevents runaway/token-budget truncation.
          // NOTE: no responseSchema here — in current Gemini API versions
          // the schema parameter itself triggers pathological repeated-token
          // output on some flash models; the strict prompt + Zod validation
          // below is more reliable.
          maxOutputTokens: 1024,
        },
      });

      const text = response?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
      if (!text) {
        log('classify', `attempt ${attempt + 1}: empty model response`);
        continue;
      }

      const parsed = parseModelJson(text);
      if (!parsed) {
        log('classify', `attempt ${attempt + 1}: malformed JSON (${text.length} chars) — retrying`);
        continue;
      }

      const result = classificationSchema.safeParse(parsed);
      if (!result.success) {
        log('classify', `attempt ${attempt + 1}: invalid classification (${result.error.issues.length} issues) — retrying`);
        continue;
      }
      let data = validateExamSlugs(result.data);
      data = validateCategory(data, input.anchorCategory);
      return applyCategoryConsistency(data);
    } catch (err) {
      log('classify', `attempt ${attempt + 1} failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  log('classify', 'all attempts failed — using safe fallback');
  return applyCategoryConsistency(fallback);
}

/**
 * Parse model JSON defensively: try full parse, then salvage the first
 * balanced JSON object from the text (models occasionally emit trailing
 * junk or get truncated mid-array).
 */
function parseModelJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    /* fall through to salvage */
  }
  const start = trimmed.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(trimmed.slice(start, i + 1)) as unknown;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}