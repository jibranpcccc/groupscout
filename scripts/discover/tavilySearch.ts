/**
 * Tavily Search API discovery provider.
 *
 * Tavily is purpose-built for AI search. Historically the free plan is
 * 1,000 searches/month (email signup, no credit card). Sign up at
 * https://tavily.com/ and copy the API key to TAVILY_API_KEY.
 *
 * Only results whose URL matches a supported platform are kept as candidates;
 * Tavily snippets are evidence, never facts.
 */
import { log } from '../utilities';
import { detectPlatform } from '../data/normalizeUrl';
import { discoveryConfig } from '../../src/config/discovery';
import type { DiscoveryProvider, DiscoveryResult } from './discoverySources';
import type { Platform } from '../../src/types/community';

interface TavilyResult {
  url?: string;
  title?: string;
  content?: string;
}

export function isTavilyConfigured(): boolean {
  return Boolean(process.env.TAVILY_API_KEY);
}

export class TavilySearchProvider implements DiscoveryProvider {
  readonly name = 'tavily-search';
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.TAVILY_API_KEY;
    if (!key) {
      throw new Error('Tavily is not configured (TAVILY_API_KEY missing).');
    }
    this.apiKey = key;
  }

  async search(query: string): Promise<DiscoveryResult[]> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: this.apiKey,
          query,
          search_depth: 'basic',
          max_results: Math.min(discoveryConfig.maxCandidatesPerQuery, 10),
          include_answer: false,
          include_raw_content: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.status === 429) {
        log('tavily', `rate limited (429) on "${query.slice(0, 50)}" — skipped`);
        return [];
      }
      if (!res.ok) {
        log('tavily', `search failed (${res.status}) on "${query.slice(0, 50)}" — skipped`);
        return [];
      }

      const data = (await res.json()) as { results?: TavilyResult[] };
      const results: DiscoveryResult[] = [];

      for (const item of data.results ?? []) {
        const url = item.url;
        if (!url) continue;
        const platform = detectPlatform(url) as Platform | undefined;
        if (!platform) continue;
        const evidence = [item.title, item.content].filter(Boolean).join(' — ').slice(0, 300);
        results.push({
          candidateUrl: url,
          sourceUrl: url,
          platform,
          confidence: 0.7, // real URL from a real index; verified at review time
          evidence: evidence || undefined,
        });
      }
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log('tavily', `request error (${message}) on "${query.slice(0, 50)}" — skipped`);
      return [];
    }
  }
}
