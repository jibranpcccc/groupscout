/**
 * Tavily Search API discovery provider — multi-key rotation & 429 failover.
 *
 * Supports:
 *   - TAVILY_API_KEYS (comma/newline-separated pool) — primary
 *   - TAVILY_API_KEY (backward-compat single key) — fallback if no pool
 *   - TAVILY_API_KEY_1 .. TAVILY_API_KEY_60 (numbered env vars)
 *
 * Keys are used in round-robin order. On 429 (rate limit / quota exhausted),
 * the provider automatically retries with the next key in the pool before
 * giving up — so one exhausted key never kills the discovery run.
 *
 * Tavily free plan: 1,000 searches/month per key (email signup, no CC).
 * With 26 keys in rotation, that's ~26,000 searches/month — enough for
 * multiple daily discovery runs.
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

/** Load all available Tavily API keys from env vars. */
function loadApiKeys(): string[] {
  const keys: string[] = [];

  // 1. TAVILY_API_KEYS — comma or newline separated pool
  const fromList = (process.env.TAVILY_API_KEYS ?? '')
    .split(/[,;\n]/)
    .map(s => s.trim())
    .filter(Boolean);
  keys.push(...fromList);

  // 2. TAVILY_API_KEY_1 .. TAVILY_API_KEY_60 (numbered env vars)
  for (let i = 1; i <= 60; i++) {
    const k = process.env[`TAVILY_API_KEY_${i}`];
    if (k && k.trim()) keys.push(k.trim());
  }

  // 3. Fallback single key (legacy)
  if (keys.length === 0 && process.env.TAVILY_API_KEY) {
    keys.push(process.env.TAVILY_API_KEY);
  }

  return keys;
}

// Module-level rotation state — persists across all search() calls in a run.
const keyPool = loadApiKeys();
let keyIndex = 0;

export function isTavilyConfigured(): boolean {
  return keyPool.length > 0;
}

export function tavilyKeyPoolSize(): number {
  return keyPool.length;
}

export class TavilySearchProvider implements DiscoveryProvider {
  readonly name = 'tavily-search';

  constructor() {
    if (keyPool.length === 0) {
      throw new Error(
        'Tavily is not configured. Set TAVILY_API_KEYS (comma-separated pool) or TAVILY_API_KEY (single).'
      );
    }
    log('tavily', `key pool loaded: ${keyPool.length} key(s) — round-robin with 429 failover enabled`);
  }

  async search(query: string): Promise<DiscoveryResult[]> {
    const pool = keyPool; // local ref for this attempt

    // Try each key in rotation, advancing on 429
    for (let attempt = 0; attempt < pool.length; attempt++) {
      const idx = keyIndex % pool.length;
      keyIndex = (keyIndex + 1) >>> 0; // unsigned increment (fast mod-safe)

      const apiKey = pool[idx];
      if (!apiKey) continue;

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: apiKey,
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
          log('tavily', `key #${idx + 1} rate-limited (429) on "${query.slice(0, 50)}" — trying next key`);
          continue; // try next key in pool
        }

        if (!res.ok) {
          log('tavily', `key #${idx + 1} failed (${res.status}) on "${query.slice(0, 50)}" — skipped`);
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
            confidence: 0.7,
            evidence: evidence || undefined,
          });
        }
        return results;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log('tavily', `key #${idx + 1} request error (${message}) on "${query.slice(0, 50)}" — trying next key`);
        continue; // transient error — try next key
      }
    }

    // All keys exhausted
    log('tavily', `all ${pool.length} key(s) exhausted on "${query.slice(0, 50)}" — no results`);
    return [];
  }
}