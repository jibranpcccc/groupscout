import type { Community } from '../types/community';
import { slugifyTag } from '../config/categories';
import { getPlatformName } from '../config/platforms';

/**
 * Client-side search over the static dataset. Normalized, case-insensitive,
 * token-based matching across title, category, tags, description, platform,
 * language and country. No server required, no heavy search engine for V1.
 */

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'of', 'for', 'and', 'or', 'in', 'on', 'with', 'to', 'at', 'by', 'is', 'are',
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ');
}

function tokens(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter((t) => !STOP_WORDS.has(t));
}

export function searchCommunities(communities: Community[], query: string): Community[] {
  const q = query.trim().toLowerCase();
  if (!q) return communities;

  // Token match: every query token must appear in at least one searchable field.
  const queryTokens = tokens(q);
  if (queryTokens.length === 0) return communities;

  return communities.filter((c) => {
    const haystack = [
      c.title,
      c.category,
      c.subcategory ?? '',
      ...c.tags,
      c.description ?? '',
      getPlatformName(c.platform),
      c.language ?? '',
      c.country ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return queryTokens.every((t) => haystack.includes(t));
  });
}

export function searchSuggestions(communities: Community[], query: string, limit = 6): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const seen = new Set<string>();
  const results: string[] = [];
  for (const c of searchCommunities(communities, q)) {
    const label = c.title;
    if (label.toLowerCase().includes(q) && !seen.has(label)) {
      seen.add(label);
      results.push(label);
    }
    if (results.length >= limit) break;
  }
  return results;
}

export { slugifyTag };
