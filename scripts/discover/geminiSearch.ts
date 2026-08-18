/**
 * Gemini discovery provider with Google Search grounding.
 *
 * IMPORTANT: only the grounding chunks' real web URLs are treated as
 * candidates. Gemini's generated prose is never a source. If the API key
 * is missing this module exports `isGeminiConfigured()` and the caller
 * fails gracefully.
 */
import { log } from '../utilities';
import { discoveryConfig } from '../../src/config/discovery';
import type { DiscoveryProvider, DiscoveryResult } from './discoverySources';
import type { Platform } from '../../src/types/community';
import { detectPlatform } from '../data/normalizeUrl';

interface GroundingChunk {
  web?: { uri?: string; title?: string };
}

interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

interface GenaiModel {
  generateContent(input: {
    model: string;
    contents: string | { role: string; parts: { text: string }[] }[];
    config?: {
      tools?: { googleSearch?: Record<string, never> }[];
      responseMimeType?: string;
      responseSchema?: Record<string, unknown>;
    };
  }): Promise<unknown>;
}

interface GenaiClient {
  models: GenaiModel;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY) && discoveryConfig.geminiSearchEnabled;
}

async function loadGenai(): Promise<GenaiClient> {
  const mod = await import('@google/genai');
  const GoogleGenAI = (mod as { GoogleGenAI: new (init: { apiKey: string }) => GenaiClient }).GoogleGenAI;
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
}

/** Extract real web URLs from grounding metadata (typed minimally). */
function groundingUrls(result: unknown): { uri: string; title?: string }[] {
  const anyResult = result as {
    candidates?: { groundingMetadata?: GroundingMetadata }[];
  };
  const chunks = anyResult?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const out: { uri: string; title?: string }[] = [];
  for (const chunk of chunks) {
    if (chunk.web?.uri) out.push({ uri: chunk.web.uri, title: chunk.web.title });
  }
  return out;
}

export class GeminiGoogleSearchProvider implements DiscoveryProvider {
  readonly name = 'gemini-google-search';
  private client: GenaiClient | null = null;

  private async clientOrThrow(): Promise<GenaiClient> {
    if (!isGeminiConfigured()) {
      throw new Error('Gemini is not configured (GEMINI_API_KEY missing or GEMINI_SEARCH_ENABLED=false).');
    }
    if (!this.client) this.client = await loadGenai();
    return this.client;
  }

  async search(query: string): Promise<DiscoveryResult[]> {
    const client = await this.clientOrThrow();
    try {
      const response = await client.models.generateContent({
        model: discoveryConfig.geminiModel,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text:
                  `Search the public web for public community invite links matching this query: "${query}". ` +
                  'Return only results that actually link to a public Telegram (t.me), WhatsApp (chat.whatsapp.com) or Discord (discord.gg / discord.com/invite) destination. ' +
                  'Do not invent URLs. Do not include login-walled or private resources. ' +
                  'Respond with a short list of the matching public invite URLs and the page that links to each.',
              },
            ],
          },
        ],
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const grounded = groundingUrls(response);
      const results: DiscoveryResult[] = [];
      for (const g of grounded) {
        const platform = detectPlatform(g.uri) as Platform | undefined;
        if (!platform) continue;
        results.push({
          candidateUrl: g.uri,
          sourceUrl: g.uri, // The landing chunk itself is the public source.
          platform,
          confidence: 0.7, // Real URL surfaced by search grounding — evidence exists.
          evidence: g.title,
        });
      }
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log('gemini', `query failed (${message}) — continuing with remaining queries`);
      return [];
    }
  }
}
