import type { Community } from '../types/community';
import { getCategoryBySlug, slugifyTag } from '../config/categories';
import { getPlatformById } from '../config/platforms';

/**
 * Central data-access layer. All components and pages MUST read community
 * data through these functions — never import groups.json directly in
 * dozens of places. A future Supabase/PostgreSQL migration only needs to
 * re-implement this module.
 */
import publishedData from '../data/groups.json';
import pendingData from '../data/pending-groups.json';

const allCommunities = publishedData as Community[];
const pendingCommunities = pendingData as Community[];

/** Every record in groups.json (including samples). */
export function getAllCommunities(): Community[] {
  return allCommunities;
}

/**
 * Published records. Sample/demo fixtures are published:true and therefore
 * included — they demo the site during development and are removed before
 * production (see README "Removing sample data").
 */
export function getPublishedCommunities(): Community[] {
  return allCommunities.filter((c) => c.published);
}

/** Records that are explicitly marked as development samples. */
export function getSampleCommunities(): Community[] {
  return allCommunities.filter((c) => c.isSample);
}

/** Pending discoveries awaiting review (not published). */
export function getPendingCommunities(): Community[] {
  return pendingCommunities;
}

export function getCommunityBySlug(slug: string): Community | undefined {
  return allCommunities.find((c) => c.slug === slug && c.published);
}

export function getCommunityById(id: string): Community | undefined {
  return allCommunities.find((c) => c.id === id);
}

export function getByCategory(categorySlug: string): Community[] {
  return getPublishedCommunities().filter((c) => c.category === categorySlug);
}

export function getByPlatform(platform: string): Community[] {
  return getPublishedCommunities().filter((c) => c.platform === platform);
}

export function getByTag(tagSlug: string): Community[] {
  return getPublishedCommunities().filter((c) =>
    c.tags.some((tag) => slugifyTag(tag) === tagSlug)
  );
}

export function getFeaturedCommunities(): Community[] {
  return getPublishedCommunities().filter((c) => c.featured);
}

/** Recently added — newest discoveredAt first. */
export function getRecentlyAdded(limit = 10): Community[] {
  return [...getPublishedCommunities()]
    .sort((a, b) => b.discoveredAt.localeCompare(a.discoveredAt))
    .slice(0, limit);
}

/** Recently checked — newest lastCheckedAt first (unknown lastCheckedAt last). */
export function getRecentlyChecked(limit = 10): Community[] {
  return [...getPublishedCommunities()]
    .sort((a, b) => {
      const at = a.lastCheckedAt ?? '';
      const bt = b.lastCheckedAt ?? '';
      return bt.localeCompare(at);
    })
    .filter((c) => c.lastCheckedAt)
    .slice(0, limit);
}

/**
 * Deterministic related-community selection (no AI at render time):
 * same category > overlapping tags > same platform > same language.
 */
export function getRelatedCommunities(community: Community, limit = 6): Community[] {
  const others = getPublishedCommunities().filter((c) => c.id !== community.id);
  const communityTags = new Set(community.tags.map(slugifyTag));

  const score = (c: Community): number => {
    let s = 0;
    if (c.category === community.category) s += 4;
    const overlap = c.tags.filter((t) => communityTags.has(slugifyTag(t))).length;
    s += Math.min(overlap, 3) * 2;
    if (c.platform === community.platform) s += 1;
    if (c.language && community.language && c.language === community.language) s += 1;
    return s;
  };

  return others
    .map((c) => ({ c, s: score(c) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s || a.c.title.localeCompare(b.c.title))
    .slice(0, limit)
    .map(({ c }) => c);
}

/** Real dataset counters for the homepage (never invented). */
export function getDatasetStats() {
  const published = getPublishedCommunities();
  const withMembers = published.filter((c) => c.memberCount != null).length;
  return {
    listed: published.length,
    categories: new Set(published.map((c) => c.category)).size,
    platforms: new Set(published.map((c) => c.platform)).size,
    recentlyChecked: published.filter(
      (c) => c.lastCheckedAt && Date.now() - new Date(c.lastCheckedAt).getTime() < 30 * 86400_000
    ).length,
    withMemberCounts: withMembers,
  };
}

/** Validate that a slug exists (for report prefills, etc.). */
export function slugExists(slug: string): boolean {
  return allCommunities.some((c) => c.slug === slug);
}

export function getCategoryLabel(slug: string): string {
  return getCategoryBySlug(slug)?.name ?? slug;
}

export function getPlatformLabel(id: string): string {
  return getPlatformById(id)?.name ?? id;
}

/**
 * Deterministic indexability evaluation for individual community detail pages.
 * A community detail page is indexable ONLY when it satisfies all criteria:
 * 1. linkStatus is verified 'active'
 * 2. Explicit mapping to at least one valid exam/certification
 * 3. Clear study vertical ('study-prep')
 * 4. Substantive unique factual description (>= 60 characters) providing genuine
 *    unique information beyond bare title/platform/member count.
 *    (Member count alone or short snippet < 60 chars is strictly NOT index-worthy).
 * 5. Zero academic integrity / dump / leak safety flags.
 *
 * Valid thin/boilerplate listings remain fully browseable to users across directory,
 * categories, exam hubs, and search, but are marked noindex,follow and sitemap-excluded.
 */
export function isCommunityIndexWorthy(c: Community): boolean {
  if (!c.published || c.isSample) return false;
  if (c.linkStatus !== 'active') return false;
  if (c.vertical !== 'study-prep') return false;

  // Explicit exam mapping required
  if (!c.exams || c.exams.length === 0) return false;

  // Substantive unique description (>= 60 characters) required
  const desc = c.description ? c.description.trim() : '';
  if (desc.length < 60) return false;

  // Zero dump / leak / integrity risk flags
  if (
    c.safetyFlags &&
    c.safetyFlags.some(
      (f) =>
        f.includes('dump') ||
        f.includes('leak') ||
        f.includes('fraud') ||
        f.includes('unauthorized')
    )
  ) {
    return false;
  }

  return true;
}

