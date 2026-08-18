/**
 * Candidate parsing/normalization: turn raw discovery results into clean,
 * validated candidates (normalized URL, detected platform, minimal slug).
 */
import { normalizeInviteUrl, detectPlatform } from '../data/normalizeUrl';
import type { DiscoveryResult } from './discoverySources';
import type { Platform } from '../../src/types/community';

export interface ParsedCandidate {
  candidateUrl: string;
  sourceUrl: string;
  platform: Platform;
  confidence: number;
  evidence?: string;
  /** Stable slug derived from the platform + identifier (may collide; dedupe handles it). */
  suggestedSlug: string;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Extract the human-readable identifier from a platform URL for slug use. */
function identifierForSlug(platform: Platform, url: string): string {
  try {
    const path = new URL(url).pathname;
    if (platform === 'telegram') {
      // t.me/<username>[/s] or t.me/s/<username>
      const m = path.match(/\/(?:s\/)?([^/]+)/);
      return m?.[1] ?? path;
    }
    return path.split('/').filter(Boolean).pop() ?? path;
  } catch {
    return url;
  }
}

export function parseCandidates(results: DiscoveryResult[]): ParsedCandidate[] {
  const seen = new Set<string>();
  const candidates: ParsedCandidate[] = [];

  for (const result of results) {
    const normalized = normalizeInviteUrl(result.candidateUrl);
    if (!normalized) continue;
    const platform = detectPlatform(normalized);
    if (!platform) continue;

    const dedupeKey = `${platform}:${normalized}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    candidates.push({
      candidateUrl: normalized,
      sourceUrl: result.sourceUrl,
      platform,
      confidence: result.confidence,
      evidence: result.evidence,
      suggestedSlug: slugify(`${platform}-${identifierForSlug(platform, normalized)}`),
    });
  }

  return candidates;
}
