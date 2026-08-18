/**
 * Discovery provider abstraction.
 *
 * A provider's job is DISCOVERY — finding candidate public URLs. It never
 * decides publication. Providers must only use public, permitted sources.
 */
import { log } from '../utilities';
import { normalizeInviteUrl, detectPlatform } from '../data/normalizeUrl';
import { loadSeeds } from '../data/io';
import { readFileSync } from 'node:fs';
import type { Platform } from '../../src/types/community';

export interface DiscoveryResult {
  /** Real candidate destination URL (must exist — never AI prose). */
  candidateUrl: string;
  /** The public page that surfaced this URL (evidence). */
  sourceUrl: string;
  platform: Platform;
  /** Internal confidence 0..1 — used ONLY in moderation logic, never shown to users. */
  confidence: number;
  /** Optional snippet of supporting public text (title/snippet from the source). */
  evidence?: string;
}

export interface DiscoveryProvider {
  readonly name: string;
  search(query: string): Promise<DiscoveryResult[]>;
}

/** Manual seed provider: reads src/data/seeds.json (or a --seeds path). */
export class ManualSeedProvider implements DiscoveryProvider {
  readonly name = 'manual-seeds';

  private seeds: DiscoveryResult[];

  constructor(seedPath?: string) {
    const raw: SeedEntry[] = seedPath
      ? (JSON.parse(readFileSync(seedPath, 'utf-8')) as SeedEntry[])
      : (loadSeeds() as SeedEntry[]);
    const results: DiscoveryResult[] = [];
    for (const seed of raw) {
      const url = normalizeInviteUrl(seed.candidateUrl);
      const platform = url ? detectPlatform(url) : undefined;
      if (!url || !platform) {
        log('seeds', `skipping invalid seed URL: ${seed.candidateUrl}`);
        continue;
      }
      results.push({
        candidateUrl: url,
        sourceUrl: seed.sourceUrl,
        platform,
        confidence: typeof seed.confidence === 'number' ? seed.confidence : 0.8,
        evidence: seed.evidence,
      });
    }
    this.seeds = results;
  }

  async search(_query: string): Promise<DiscoveryResult[]> {
    // Seeds are not query-dependent; they are returned once per run.
    return [];
  }

  getSeedResults(): DiscoveryResult[] {
    return this.seeds;
  }
}

interface SeedEntry {
  candidateUrl: string;
  sourceUrl: string;
  platform?: string;
  confidence?: number;
  evidence?: string;
}

/**
 * Telegram public search adapter — kept DISABLED until explicitly configured.
 * If an official/permitted public search mechanism is later added, implement
 * it here without joining groups or bypassing protections.
 */
export class TelegramPublicSearchProvider implements DiscoveryProvider {
  readonly name = 'telegram-public-search';
  private readonly enabled = false;

  constructor() {
    if (this.enabled) {
      throw new Error('TelegramPublicSearchProvider is disabled by default. Enable only via an explicitly configured, permitted mechanism.');
    }
  }

  async search(_query: string): Promise<DiscoveryResult[]> {
    log('telegram-search', 'adapter disabled — no permitted public mechanism configured');
    return [];
  }
}
