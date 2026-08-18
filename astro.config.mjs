// Astro config. Note: kept out of the tsconfig include (vite plugin type
// mismatches between astro's bundled vite and the root vite are expected).
/* global process, URL */
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';

const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:4321';

// Indexation thresholds (must match src/config/discovery.ts).
const TAG_PAGE_INDEX_MIN = 5;
const CATEGORY_INDEX_MIN = 3;

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
for (const c of realGroups) {
  categoryCounts.set(c.category, (categoryCounts.get(c.category) || 0) + 1);
  for (const t of c.tags) {
    const s = slugifyTag(t);
    tagCounts.set(s, (tagCounts.get(s) || 0) + 1);
  }
}

export default defineConfig({
  site: siteUrl,
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) => {
        // Utility / non-indexable routes (submit/report are noindex forms).
        const excludedPrefixes = [
          '/404/',
          '/submit/',
          '/report/',
          '/submit/success/',
          '/report/success/',
          '/recently-added/',
          '/recently-updated/',
          '/new/',
        ];
        if (excludedPrefixes.some((p) => page.includes(p))) return false;

        // Thin tag pages (fewer than TAG_PAGE_INDEX_MIN real communities).
        const tagMatch = page.match(/\/tag\/([^/]+)\/$/);
        if (tagMatch && (tagCounts.get(tagMatch[1]) ?? 0) < TAG_PAGE_INDEX_MIN) return false;

        // Empty/near-empty category pages.
        const catMatch = page.match(/\/category\/([^/]+)\/$/);
        if (catMatch && (categoryCounts.get(catMatch[1]) ?? 0) < CATEGORY_INDEX_MIN) return false;

        return true;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
