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

// Map of categories with indexable child exams (>=5) or >= 5 communities
const indexableCategories = new Set([
  'college-admissions',
  'graduate-admissions',
  'entrance-exams',
  'english-proficiency',
  'medical-healthcare',
  'law',
  'finance-accounting',
  'cybersecurity-certifications',
]);

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
          if (grp && (grp.updatedAt || grp.lastCheckedAt || grp.discoveredAt)) {
            item.lastmod = new Date(grp.updatedAt || grp.lastCheckedAt || grp.discoveredAt).toISOString();
          }
        }
        const examMatch = item.url.match(/\/exam\/([^/]+)\/?$/);
        if (examMatch) {
          const examGroups = realGroups.filter((g) => (g.exams || []).includes(examMatch[1]));
          const latest = examGroups.reduce((max, g) => {
            const d = new Date(g.updatedAt || g.lastCheckedAt || g.discoveredAt).getTime();
            return d > max ? d : max;
          }, 0);
          if (latest > 0) {
            item.lastmod = new Date(latest).toISOString();
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
