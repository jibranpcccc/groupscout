import type { APIRoute } from 'astro';
import { siteConfig } from '../config/site';
import { getPublishedCommunities, isCommunityIndexWorthy } from '../lib/communities';

/**
 * Lightweight RSS feed of the most recently added indexable communities.
 */
export const GET: APIRoute = () => {
  const communities = getPublishedCommunities()
    .filter(isCommunityIndexWorthy)
    .slice()
    .sort((a, b) => b.discoveredAt.localeCompare(a.discoveredAt))
    .slice(0, 30);

  const items = communities
    .map((c) => {
      const link = `${siteConfig.url}/group/${c.slug}/`;
      const desc = c.description ?? `A publicly listed ${c.platform} community.`;
      return `    <item>
      <title><![CDATA[${c.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(c.discoveredAt).toUTCString()}</pubDate>
      <description><![CDATA[${desc}]]></description>
    </item>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteConfig.name} — Verified Study Groups</title>
    <link>${siteConfig.url}</link>
    <description>Recently verified public exam-prep and certification study communities.</description>
    <language>en</language>
    <atom:link href="${siteConfig.url}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
