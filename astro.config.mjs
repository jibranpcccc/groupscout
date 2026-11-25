// Astro config. Note: kept out of the tsconfig include (vite plugin type
// mismatches between astro's bundled vite and the root vite are expected).
/* global process, URL */
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';

const rawEnvUrl = process.env.PUBLIC_SITE_URL;
const siteUrl =
  rawEnvUrl && !rawEnvUrl.includes('localhost') && !rawEnvUrl.includes('127.0.0.1')
    ? rawEnvUrl.replace(/\/+$/, '')
    : 'https://studygroupshub.com';

// Indexation thresholds (must match src/config/discovery.ts).
const EXAM_INDEX_MIN = 5;
const PLATFORM_INDEX_MIN = 5;

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
const categoryExams = new Map();
for (const c of realGroups) {
  categoryCounts.set(c.category, (categoryCounts.get(c.category) || 0) + 1);
  if (!categoryExams.has(c.category)) categoryExams.set(c.category, new Set());
  for (const t of c.tags) {
    const s = slugifyTag(t);
    tagCounts.set(s, (tagCounts.get(s) || 0) + 1);
  }
  for (const e of c.exams ?? []) {
    examCounts.set(e, (examCounts.get(e) || 0) + 1);
    categoryExams.get(c.category).add(e);
  }
}

const tsMs = (val) => {
  if (!val) return 0;
  const ms = new Date(val).getTime();
  return Number.isFinite(ms) ? ms : 0;
};
const latestGroupMs = (g) => Math.max(tsMs(g.updatedAt), tsMs(g.lastCheckedAt), tsMs(g.discoveredAt));
const siteLatestMs = realGroups.reduce((max, g) => {
  const m = latestGroupMs(g);
  return m > max ? m : max;
}, 0);
const siteLatestIso = (siteLatestMs > 0 ? new Date(siteLatestMs) : new Date()).toISOString();

const isCommunityIndexWorthy = (c) => {
  if (!c.published || c.isSample) return false;
  if (c.linkStatus !== 'active') return false;
  if (c.vertical !== 'study-prep') return false;
  if (!c.exams || c.exams.length === 0) return false;
  const desc = c.description ? c.description.trim() : '';
  if (desc.length < 60) return false;
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
};

const indexableGroupSlugs = new Set(
  realGroups.filter(isCommunityIndexWorthy).map((c) => c.slug)
);

// Compute indexable categories dynamically (>= 5 communities in category).
const indexableCategories = new Set();
for (const [cat, count] of categoryCounts.entries()) {
  if (count >= 5) {
    indexableCategories.add(cat);
  }
}

export default defineConfig({
  site: siteUrl,
  output: 'static',
  trailingSlash: 'always',
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

        // Thin category pages (must have >=5 communities or an indexable child exam).
        const catMatch = page.match(/\/category\/([^/]+)\/?$/);
        if (catMatch && !indexableCategories.has(catMatch[1])) return false;

        // Platform pages (must meet PLATFORM_INDEX_MIN threshold).
        const platMatch = page.match(/\/platform\/([^/]+)\/?$/);
        if (platMatch) {
          const platCount = realGroups.filter((c) => c.platform === platMatch[1]).length;
          if (platCount < PLATFORM_INDEX_MIN) return false;
        }

        return true;
      },
      serialize: (item) => {
        const groupMatch = item.url.match(/\/group\/([^/]+)\/?$/);
        if (groupMatch) {
          const grp = realGroups.find((g) => g.slug === groupMatch[1]);
          const ms = grp ? latestGroupMs(grp) : 0;
          item.lastmod = ms > 0 ? new Date(ms).toISOString() : siteLatestIso;
          return item;
        }
        const examMatch = item.url.match(/\/exam\/([^/]+)\/?$/);
        if (examMatch) {
          const examGroups = realGroups.filter((g) => (g.exams || []).includes(examMatch[1]));
          const latest = examGroups.reduce((max, g) => Math.max(max, latestGroupMs(g)), 0);
          item.lastmod = latest > 0 ? new Date(latest).toISOString() : siteLatestIso;
          return item;
        }
        const catMatch = item.url.match(/\/category\/([^/]+)\/?$/);
        if (catMatch) {
          const catGroups = realGroups.filter((g) => g.category === catMatch[1]);
          const latest = catGroups.reduce((max, g) => Math.max(max, latestGroupMs(g)), 0);
          item.lastmod = latest > 0 ? new Date(latest).toISOString() : siteLatestIso;
          return item;
        }
        const platMatch = item.url.match(/\/platform\/([^/]+)\/?$/);
        if (platMatch) {
          const platGroups = realGroups.filter((g) => g.platform === platMatch[1]);
          const latest = platGroups.reduce((max, g) => Math.max(max, latestGroupMs(g)), 0);
          item.lastmod = latest > 0 ? new Date(latest).toISOString() : siteLatestIso;
          return item;
        }
        item.lastmod = siteLatestIso;
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
