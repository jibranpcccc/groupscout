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
  `Classify the candidate using ONLY the supplied source evidence (URL, source page title, snippet, query context).`,
  'Rules:',
  '- Use only supplied source evidence.',
  '- If unknown, return null (or "unknown" for enums).',
  '- Do not invent facts. Do not invent URLs. Do not infer member counts.',
  '- title: the community name if clearly identifiable from evidence, else null.',
  `- category: one of: ${categoryNames}, else null.`,
  '- tags: max 8 short tags, lowercase-ish, derived from evidence.',
  '- description: max 400 chars, a concise factual summary of the evidence. null if no evidence.',
  '- confidence: 0..1 — how confident you are that the candidate is a real, public, well-described community. Use low values for weak evidence.',
  'Respond with JSON only, matching this schema exactly:',
  JSON.stringify(
    {
      title: 'string|null',
      category: 'string|null',
      subcategory: 'string|null',
      tags: ['string'],
      language: 'string|null',
      country: 'string|null',
      communityType: 'discussion|education|signals|news|jobs|deals|support|other|unknown',
      accessType: 'free|paid|mixed|unknown',
      description: 'string|null',
      confidence: 0.5,
    },
    null,
    2
  ),
].join('\n');

interface ClassificationInput {
  candidate: ParsedCandidate;
  anchorCategory?: string;
  anchorTag?: string;
}

/**
 * Classify a candidate. On any failure (no key, model error, invalid JSON)
 * returns a minimal safe classification with confidence 0 so the pipeline
 * can continue without crashing.
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

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

    const evidenceText = [
      `Candidate URL: ${input.candidate.candidateUrl}`,
      `Source page: ${input.candidate.sourceUrl}`,
      input.candidate.evidence ? `Source snippet: ${input.candidate.evidence}` : null,
      input.anchorTag ? `Query anchor tag: ${input.anchorTag}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const response = await ai.models.generateContent({
      model: discoveryConfig.geminiModel,
      contents: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'user', parts: [{ text: `Evidence:\n${evidenceText}` }] },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            category: { type: 'STRING' },
            subcategory: { type: 'STRING' },
            tags: { type: 'ARRAY', items: { type: 'STRING' } },
            language: { type: 'STRING' },
            country: { type: 'STRING' },
            communityType: { type: 'STRING' },
            accessType: { type: 'STRING' },
            description: { type: 'STRING' },
            confidence: { type: 'NUMBER' },
          },
        },
      },
    });

    const text = response?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
    if (!text) {
      log('classify', 'empty model response — using fallback');
      return fallback;
    }

    const parsed = JSON.parse(text) as unknown;
    const result = classificationSchema.safeParse(parsed);
    if (!result.success) {
      log('classify', `invalid classification JSON (${result.error.issues.length} issues) — using fallback`);
      return fallback;
    }
    return result.data;
  } catch (err) {
    log('classify', `classification failed: ${err instanceof Error ? err.message : String(err)}`);
    return fallback;
  }
}
