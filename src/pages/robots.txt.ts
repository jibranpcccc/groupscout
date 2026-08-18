import type { APIRoute } from 'astro';
import { siteConfig } from '../config/site';

/**
 * robots.txt generated from the production site URL so the sitemap link
 * never points at a localhost or Netlify preview domain.
 */
export const GET: APIRoute = () => {
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    '# Utility routes (forms, success pages) are excluded from crawling',
    'Disallow: /submit/',
    'Disallow: /submit/success/',
    'Disallow: /report/',
    'Disallow: /report/success/',
    '',
    `Sitemap: ${siteConfig.url}/sitemap-index.xml`,
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
