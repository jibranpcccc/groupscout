/**
 * Brave Search API discovery provider.
 *
 * Free tier: 2,000 queries/month (~66/day), 1 request/second — comfortably
 * enough for the discovery budget (default 30 queries/day). Requires a free
 * API key from https://brave.com/search/api/ (no credit card).
 *
 * Only results whose URL matches a supported platform are kept as candidates;
 * Brave's own snippets are evidence, never facts.
 */
import { log } from '../utilities';
import { detectPlatform } from '../data/normalizeUrl';
import { discoveryConfig } from '../../src/config/discovery';
import type { DiscoveryProvider, DiscoveryResult } from './discoverySources';
import type { Platform } from '../../src/types/community';

interface BraveWebResult {
  url?: string;
  title?: string;
  description?: string;
}

export function isBraveConfigured(): boolean {
  return Boolean(process.env.BRAVE_API_KEY);
}

export class BraveSearchProvider implements DiscoveryProvider {
  readonly name = 'brave-search';
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.BRAVE_API_KEY;
    if (!key) {
      throw new Error('Brave Search is not configured (BRAVE_API_KEY missing).');
    }
    this.apiKey = key;
  }

  async search(query: string): Promise<DiscoveryResult[]> {
    const params = new URLSearchParams({
      q: query,
      count: String(Math.min(discoveryConfig.maxCandidatesPerQuery, 10)),
      search_lang: 'en',
      freshness: 'month', // prefer recent public pages for discovery
      extra_snippets: 'false',
    });

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
        headers: {
          'X-Subscription-Token': this.apiKey,
          Accept: 'application/json',
          'User-Agent': 'community-directory-discovery/0.1 (public directory research)',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.status === 429) {
        log('brave', `rate limited (429) on "${query.slice(0, 50)}" — skipped`);
        return [];
      }
      if (!res.ok) {
        log('brave', `search failed (${res.status}) on "${query.slice(0, 50)}" — skipped`);
        return [];
      }

      const data = (await res.json()) as { web?: { results?: BraveWebResult[] } };
      const results: DiscoveryResult[] = [];

      for (const item of data.web?.results ?? []) {
        const url = item.url;
        if (!url) continue;
        const platform = detectPlatform(url) as Platform | undefined;
        if (!platform) continue;
        const evidence = [item.title, item.description].filter(Boolean).join(' — ').slice(0, 300);
        results.push({
          candidateUrl: url,
          sourceUrl: url, // the search result page is the public source
          platform,
          confidence: 0.7, // real URL from a real index; verified at review time
          evidence: evidence || undefined,
        });
      }
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log('brave', `request error (${message}) on "${query.slice(0, 50)}" — skipped`);
      return [];
    }
  }
}
