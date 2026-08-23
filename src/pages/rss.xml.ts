import type { APIRoute } from 'astro';
import { siteConfig } from '../config/site';
import { getPublishedCommunities } from '../lib/communities';

/**
 * Lightweight RSS feed of the most recently added communities.
 */
export const GET: APIRoute = () => {
  const communities = getPublishedCommunities()
    .slice()
    .sort((a, b) => b.discoveredAt.localeCompare(a.discoveredAt))
    .slice(0, 30);

  const items = communities
    .map((c) => {
      const link = `${siteConfig.url}/group/${c.slug}/`;
      const description = (c.description ?? `A publicly listed ${c.platform} community.`)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `    <item>
      <title>${c.title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${new Date(c.discoveredAt).toUTCString()}</pubDate>
      <description>${description}</description>
    </item>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${siteConfig.name} — Recently Added</title>
    <link>${siteConfig.url}</link>
    <description>Recently added public online communities.</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
