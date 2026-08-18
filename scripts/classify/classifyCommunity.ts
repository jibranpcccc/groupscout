/**
 * Gemini classification of discovery candidates.
 *
 * Strict structured output; the result is validated with Zod. Gemini is
 * explicitly instructed to use only the supplied source evidence, return
 * null for unknowns, and never invent URLs, member counts or facts.
 */
import { z } from 'zod';
import { log } from '../utilities';
import { discoveryConfig } from '../../src/config/discovery';
import { categories } from '../../src/config/categories';
import { isGeminiConfigured } from '../discover/geminiSearch';
import { enforceCategoryConsistency } from './categoryConsistency';
import type { ParsedCandidate } from '../discover/parseCandidates';

export const classificationSchema = z
  .object({
    title: z.string().min(2).max(140).nullable(),
    category: z.string().nullable(),
    subcategory: z.string().max(120).nullable(),
    tags: z.array(z.string().min(1).max(40)).max(8).default([]),
    language: z.string().max(40).nullable(),
    country: z.string().max(40).nullable(),
    communityType: z
      .enum(['discussion', 'education', 'signals', 'news', 'jobs', 'deals', 'support', 'other', 'unknown'])
      .default('unknown'),
    accessType: z.enum(['free', 'paid', 'mixed', 'unknown']).default('unknown'),
    description: z.string().max(400).nullable(),
    confidence: z.number().min(0).max(1).default(0),
  })
  .strict();

export type ClassificationResult = z.infer<typeof classificationSchema>;

const categoryNames = categories.map((c) => c.slug).join(', ');

const SYSTEM_PROMPT = [
  'You are a metadata classifier for a directory of public online communities (Telegram, WhatsApp, Discord).',
  'Classify the candidate using ONLY the supplied source evidence (URL, source page title, snippet, query context).',
  'Rules:',
  '- Use only supplied source evidence.',
  '- If unknown, return null (or "unknown" for enums).',
  '- Do not invent facts. Do not invent URLs. Do not infer member counts.',
  '- title: the community name if clearly identifiable from evidence, else null.',
  `- category: one of: ${categoryNames}, else null.`,
  '- tags: max 8 short tags derived from evidence.',
  '- description: max 400 chars, a concise factual summary of the evidence. null if no evidence.',
  '- confidence: number 0..1.',
  'Reply with JSON only, exactly matching this shape:',
  '{"title":"string|null","category":"string|null","subcategory":"string|null","tags":["string"],"language":"string|null","country":"string|null","communityType":"discussion|education|signals|news|jobs|deals|support|other|unknown","accessType":"free|paid|mixed|unknown","description":"string|null","confidence":0.5}',
].join('\n');

interface ClassificationInput {
  candidate: ParsedCandidate;
  anchorCategory?: string;
  anchorTag?: string;
}

/**
 * Apply rule-based category consistency to a classification result before
 * it leaves this module. Overrides the category only on a strong (>=2
 * keyword hits from one category) signal; logs a structured line when a
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
    category: input.anchorCategory ?? null,
    subcategory: null,
    tags: [],
    language: null,
    country: null,
    communityType: 'unknown',
    accessType: 'unknown',
    description: null,
    confidence: 0,
  };

  if (!isGeminiConfigured()) {
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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

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
      return applyCategoryConsistency(result.data);
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
