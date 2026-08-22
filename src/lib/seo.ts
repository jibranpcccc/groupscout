import { siteConfig } from '../config/site';
import type { Community } from '../types/community';
import { getCategoryName } from '../config/categories';
import { getPlatformName } from '../config/platforms';
import { getExamName } from '../config/exams';

/**
 * SEO helpers: unique titles, descriptions, canonical URLs, Open Graph and
 * JSON-LD builders. Canonical URLs always derive from PUBLIC_SITE_URL —
 * never from a Netlify preview URL.
 */

export function canonicalUrl(path: string): string {
  const base = siteConfig.url.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

/** Join title parts with the site name, skipping empties. */
export function pageTitle(...parts: (string | null | undefined)[]): string {
  const nonEmpty = parts.filter((p): p is string => Boolean(p));
  return [...nonEmpty, siteConfig.name].join(' | ');
}

export function communityTitle(community: Community): string {
  const platformName = getPlatformName(community.platform);
  const primaryExam = community.exams?.[0] ? getExamName(community.exams[0]) : null;

  if (primaryExam) {
    return `${community.title} – ${primaryExam} Study Group on ${platformName} | ${siteConfig.name}`;
  }
  return `${community.title} – ${platformName} Study Group | ${siteConfig.name}`;
}

export function communityDescription(community: Community): string {
  const platformName = getPlatformName(community.platform);
  const primaryExam = community.exams?.[0] ? getExamName(community.exams[0]) : null;
  const targetTopic = primaryExam ? `${primaryExam} exam preparation` : `${getCategoryName(community.category)} study`;

  if (community.description && community.description.trim().length >= 40) {
    const cleanDesc = community.description.trim().replace(/\s+/g, ' ');
    if (cleanDesc.length > 155) {
      return `${cleanDesc.slice(0, 152)}...`;
    }
    return cleanDesc;
  }

  return `Public ${platformName} study group: ${community.title} for ${targetTopic}. Browse verified resources and discussions on StudyGroupsHub.`;
}

export function categoryPageTitle(slug: string): string {
  return pageTitle(getCategoryName(slug), 'Study Groups & Communities');
}

export function platformPageTitle(platform: string): string {
  return pageTitle(`${getPlatformName(platform)} Study Groups`);
}

export function tagPageTitle(tag: string): string {
  return pageTitle(`${tag} Communities`);
}

export interface PageMeta {
  title: string;
  description: string;
  canonicalPath: string;
  noindex?: boolean;
  ogType?: 'website' | 'article';
  ogImage?: string;
}

export function buildMeta(meta: PageMeta) {
  const url = canonicalUrl(meta.canonicalPath);
  const ogImage = meta.ogImage
    ? `${siteConfig.url.replace(/\/+$/, '')}${meta.ogImage}`
    : `${siteConfig.url.replace(/\/+$/, '')}${siteConfig.ogImagePath}`;
  return {
    title: meta.title,
    description: meta.description,
    canonical: url,
    noindex: meta.noindex === true,
    og: {
      type: meta.ogType ?? 'website',
      url,
      title: meta.title,
      description: meta.description,
      image: ogImage,
      siteName: siteConfig.name,
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      image: ogImage,
    },
  };
}

export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function websiteJsonLd() {
  return jsonLd({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: canonicalUrl('/'),
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${canonicalUrl('/communities/')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  });
}

export function organizationJsonLd() {
  return jsonLd({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: canonicalUrl('/'),
    logo: canonicalUrl(siteConfig.ogImagePath),
  });
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return jsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  });
}

export function collectionPageJsonLd(name: string, description: string, items: Community[]) {
  return jsonLd({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: canonicalUrl('/communities/'),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.slice(0, 50).map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.title,
        url: canonicalUrl(`/group/${c.slug}/`),
      })),
    },
  });
}
