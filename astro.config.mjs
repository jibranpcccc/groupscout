// Astro config. Note: kept out of the tsconfig include (vite plugin type
// mismatches between astro's bundled vite and the root vite are expected).
/* global process */
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:4321';

export default defineConfig({
  site: siteUrl,
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) => {
        // Utility/non-indexable routes must not appear in the sitemap.
        const excluded = ['/404/', '/submit/success/', '/report/success/'];
        return !excluded.some((path) => page.includes(path));
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
