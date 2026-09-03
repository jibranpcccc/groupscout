/**
 * Central site configuration. Branding is intentionally easy to replace:
 * edit the values here (and swap public/favicon.svg + public/images/og-default.svg).
 *
 * NOTE: this module uses `import.meta.env` (Astro-only). Node scripts under
 * `scripts/` must NOT import it — see AGENTS.md §5.
 */

function getPublicSiteUrl(): string {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  const configured = env?.PUBLIC_SITE_URL?.replace(/\/+$/, '');
  if (configured && !configured.includes('localhost') && !configured.includes('127.0.0.1')) {
    return configured;
  }
  return 'https://studygroupshub.com';
}

function getEnvVar(key: string): string | undefined {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  return env?.[key];
}

export const siteConfig = {
  /** Display name — change here to rebrand (routes don't depend on it). */
  name: 'StudyGroupsHub',
  shortName: 'StudyGroupsHub',
  description:
    'StudyGroupsHub is a directory of active public exam-prep and professional-certification study communities across Discord, Telegram and WhatsApp.',
  /** Production URL, no trailing slash. Set PUBLIC_SITE_URL in Netlify/GitHub. */
  url: getPublicSiteUrl(),
  defaultLocale: 'en',
  /** Path to the global Open Graph fallback image (1200×630). */
  ogImagePath: '/images/og-default.png',
  /** Footer disclaimer — accurate trademark wording. */
  notAffiliatedNotice:
    'Not affiliated with Telegram, WhatsApp, Discord, or their parent companies.',
  /** Google Analytics 4 Measurement ID (e.g. G-XXXXXXXXXX) */
  gaMeasurementId: getEnvVar('PUBLIC_GA_MEASUREMENT_ID') || 'G-553LRP3Z7R',
  /** Google Search Console verification meta tag token */
  googleSiteVerification: getEnvVar('PUBLIC_GOOGLE_SITE_VERIFICATION'),
  /** Bing Webmaster Tools verification meta tag token */
  bingSiteVerification: getEnvVar('PUBLIC_BING_SITE_VERIFICATION'),
} as const;

export type SiteConfig = typeof siteConfig;
