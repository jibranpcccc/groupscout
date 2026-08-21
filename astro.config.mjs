// Astro config. Note: kept out of the tsconfig include (vite plugin type
// mismatches between astro's bundled vite and the root vite are expected).
/* global process, URL */
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';

const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:4321';

// Indexation thresholds (must match src/config/discovery.ts).
const CATEGORY_INDEX_MIN = 3;
const EXAM_INDEX_MIN = 5;

// Real published counts from the production data source — demo/sample
// records are excluded so they can never appear in the sitemap.
const groups = JSON.parse(
  readFileSync(new URL('./src/data/groups.json', import.meta.url), 'utf-8')
);
const realGroups = groups.filter((c) => c.published && c.isSample !== true);

const slugifyTag = (tag) =>
  tag
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const tagCounts = new Map();
const categoryCounts = new Map();
const examCounts = new Map();
for (const c of realGroups) {
  categoryCounts.set(c.category, (categoryCounts.get(c.category) || 0) + 1);
  for (const t of c.tags) {
    const s = slugifyTag(t);
    tagCounts.set(s, (tagCounts.get(s) || 0) + 1);
  }
  for (const e of c.exams ?? []) {
    examCounts.set(e, (examCounts.get(e) || 0) + 1);
  }
}

const isCommunityIndexWorthy = (c) => {
  if (!c.published || c.isSample) return false;
  if (c.linkStatus !== 'active') return false;
  const hasSubstantiveDesc = Boolean(c.description && c.description.trim().length >= 40);
  const hasMemberData = Boolean(c.memberCount && c.memberCount > 0);
  if (!hasSubstantiveDesc && !hasMemberData) return false;
  const hasExamOrCategory = (c.exams && c.exams.length > 0) || Boolean(c.category);
  return Boolean(hasExamOrCategory);
};

const indexableGroupSlugs = new Set(
  realGroups.filter(isCommunityIndexWorthy).map((c) => c.slug)
);

export default defineConfig({
  site: siteUrl,
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) => {
        // Utility / non-indexable routes (submit/report are noindex forms, 404 is error).
        const excludedPrefixes = [
          '/404',
          '/submit',
          '/report',
          '/recently-added',
          '/recently-updated',
          '/new',
        ];
        if (excludedPrefixes.some((p) => page.includes(p))) return false;

        // Tag pages are noindex to avoid keyword cannibalization with exam hubs.
        if (page.includes('/tag/')) return false;

        // Paginated directory pages (>1) are noindex/crawlable only; page 1 (/communities/) is canonical.
        if (page.match(/\/communities\/\d+\/?$/)) return false;

        // Community detail pages: only index-worthy records with sufficient unique value.
        const groupMatch = page.match(/\/group\/([^/]+)\/?$/);
        if (groupMatch && !indexableGroupSlugs.has(groupMatch[1])) return false;

        // Thin exam pages (fewer than EXAM_INDEX_MIN real communities).
        const examMatch = page.match(/\/exam\/([^/]+)\/?$/);
        if (examMatch && (examCounts.get(examMatch[1]) ?? 0) < EXAM_INDEX_MIN) return false;

        // Empty/near-empty category pages.
        const catMatch = page.match(/\/category\/([^/]+)\/?$/);
        if (catMatch && (categoryCounts.get(catMatch[1]) ?? 0) < CATEGORY_INDEX_MIN) return false;

        return true;
      },
      serialize: (item) => {
        const groupMatch = item.url.match(/\/group\/([^/]+)\/?$/);
        if (groupMatch) {
          const grp = realGroups.find((g) => g.slug === groupMatch[1]);
          if (grp && (grp.updatedAt || grp.lastCheckedAt || grp.discoveredAt)) {
            item.lastmod = new Date(grp.updatedAt || grp.lastCheckedAt || grp.discoveredAt).toISOString();
          }
        }
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
