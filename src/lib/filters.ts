import type { Community } from '../types/community';
import { slugifyTag } from '../config/categories';

/**
 * Filtering + filter-option helpers. Only choices actually represented in
 * the data are offered — no dead filter options.
 */

export interface FilterState {
  q?: string;
  platform?: string;
  category?: string;
  tag?: string;
  language?: string;
  country?: string;
  accessType?: string;
  verification?: string;
  linkStatus?: string;
  sort?: string;
}

export type SortKey = 'newest' | 'recently-checked' | 'alphabetical' | 'member-count';

const SORTS: SortKey[] = ['newest', 'recently-checked', 'alphabetical', 'member-count'];

export function isSortKey(value: string | undefined): value is SortKey {
  return SORTS.includes(value as SortKey);
}

export function normalizeFilters(params: URLSearchParams): FilterState {
  const pick = (key: string): string | undefined => {
    const v = params.get(key)?.trim();
    return v && v !== 'all' ? v : undefined;
  };
  return {
    q: pick('q'),
    platform: pick('platform'),
    category: pick('category'),
    tag: pick('tag'),
    language: pick('language'),
    country: pick('country'),
    accessType: pick('accessType'),
    verification: pick('verification'),
    linkStatus: pick('linkStatus'),
    sort: isSortKey(params.get('sort') ?? undefined) ? (params.get('sort') as string) : undefined,
  };
}

export function matchesFilters(community: Community, filters: FilterState): boolean {
  if (filters.platform && community.platform !== filters.platform) return false;
  if (filters.category && community.category !== filters.category) return false;
  if (filters.tag && !community.tags.some((t) => slugifyTag(t) === filters.tag)) return false;
  if (filters.language && (community.language ?? '') !== filters.language) return false;
  if (filters.country && (community.country ?? '') !== filters.country) return false;
  if (filters.accessType && (community.accessType ?? 'unknown') !== filters.accessType) return false;
  if (filters.verification && community.verificationStatus !== filters.verification) return false;
  if (filters.linkStatus && community.linkStatus !== filters.linkStatus) return false;
  return true;
}

export function sortCommunities(communities: Community[], sort?: string): Community[] {
  const key: SortKey = isSortKey(sort) ? sort : 'newest';
  const arr = [...communities];
  switch (key) {
    case 'alphabetical':
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case 'recently-checked':
      return arr.sort((a, b) => (b.lastCheckedAt ?? '').localeCompare(a.lastCheckedAt ?? ''));
    case 'member-count':
      return arr.sort(
        (a, b) => (b.memberCount ?? -1) - (a.memberCount ?? -1)
      );
    case 'newest':
    default:
      return arr.sort((a, b) => b.discoveredAt.localeCompare(a.discoveredAt));
  }
}

export interface FilterOptions {
  platforms: string[];
  categories: string[];
  tags: { slug: string; name: string }[];
  languages: string[];
  countries: string[];
  accessTypes: string[];
  verificationStatuses: string[];
  linkStatuses: string[];
  hasMemberCounts: boolean;
}

export function availableFilterOptions(communities: Community[]): FilterOptions {
  const unique = (values: (string | null | undefined)[]): string[] => [
    ...new Set(values.filter((v): v is string => Boolean(v))),
  ].sort();

  const tags = new Map<string, string>();
  for (const c of communities) {
    for (const t of c.tags) tags.set(slugifyTag(t), t);
  }

  return {
    platforms: unique(communities.map((c) => c.platform)),
    categories: unique(communities.map((c) => c.category)),
    tags: [...tags.entries()].map(([slug, name]) => ({ slug, name })),
    languages: unique(communities.map((c) => c.language)),
    countries: unique(communities.map((c) => c.country)),
    accessTypes: unique(communities.map((c) => c.accessType)),
    verificationStatuses: unique(communities.map((c) => c.verificationStatus)),
    linkStatuses: unique(communities.map((c) => c.linkStatus)),
    hasMemberCounts: communities.some((c) => c.memberCount != null),
  };
}

export function hasActiveFilters(filters: FilterState): boolean {
  return Boolean(
    filters.q ||
      filters.platform ||
      filters.category ||
      filters.tag ||
      filters.language ||
      filters.country ||
      filters.accessType ||
      filters.verification ||
      filters.linkStatus
  );
}
