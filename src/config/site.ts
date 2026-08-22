/**
 * Central site configuration. Branding is intentionally easy to replace:
 * edit the values here (and swap public/favicon.svg + public/images/og-default.svg).
 *
 * NOTE: this module uses `import.meta.env` (Astro-only). Node scripts under
 * `scripts/` must NOT import it — see AGENTS.md §5.
 */

function getPublicSiteUrl(): string {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  return env?.PUBLIC_SITE_URL?.replace(/\/+$/, '') || 'https://studygroupshub.com';
}

export const siteConfig = {
  /** Display name — change here to rebrand (routes don't depend on it). */
  name: 'StudyScout',
  shortName: 'StudyScout',
  description:
    'StudyScout is a directory of active public exam-prep and professional-certification study communities across Discord, Telegram and WhatsApp.',
  /** Production URL, no trailing slash. Set PUBLIC_SITE_URL in Netlify/GitHub. */
  url: getPublicSiteUrl(),
  defaultLocale: 'en',
  /** Path to the global Open Graph fallback image (1200×630). */
  ogImagePath: '/images/og-default.svg',
  /** Footer disclaimer — accurate trademark wording. */
  notAffiliatedNotice:
    'Not affiliated with Telegram, WhatsApp, Discord, or their parent companies.',
} as const;

export type SiteConfig = typeof siteConfig;
