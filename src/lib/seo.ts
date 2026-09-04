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
    const cleanDesc = community.description
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_~`#]+/g, '')
      .trim()
      .replace(/\s+/g, ' ');

    if (cleanDesc.length >= 40) {
      if (cleanDesc.length > 155) {
        return `${cleanDesc.slice(0, 152)}...`;
      }
      return cleanDesc;
    }
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

/** Schema.org @graph container for combining multiple linked entities without JSON syntax errors. */
export function graphJsonLd(nodes: (Record<string, unknown> | null | undefined)[]): string {
  const valid = nodes.filter((n): n is Record<string, unknown> => Boolean(n));
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': valid,
  }).replace(/</g, '\\u003c');
}

export function websiteGraphNode() {
  return {
    '@type': 'WebSite',
    '@id': `${canonicalUrl('/')}#website`,
    name: siteConfig.name,
    url: canonicalUrl('/'),
    description: siteConfig.description,
    publisher: { '@id': `${canonicalUrl('/')}#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${canonicalUrl('/communities/')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en',
  };
}

export function organizationGraphNode() {
  return {
    '@type': 'Organization',
    '@id': `${canonicalUrl('/')}#organization`,
    name: siteConfig.name,
    url: canonicalUrl('/'),
    logo: {
      '@type': 'ImageObject',
      '@id': `${canonicalUrl('/')}#logo`,
      url: canonicalUrl(siteConfig.ogImagePath),
      caption: `${siteConfig.name} Logo`,
    },
    description: siteConfig.description,
    knowsAbout: [
      'Standardized Testing',
      'Study Groups',
      'Exam Preparation',
      'IELTS',
      'Digital SAT',
      'USMLE',
      'NCLEX-RN',
      'GRE',
      'GMAT Focus',
      'NEET UG',
      'JEE Main',
      'UPSC Civil Services',
      'GATE',
      'CFA',
      'CPA',
      'LSAT',
      'CISSP',
      'Telegram Communities',
      'Discord Study Servers',
      'Academic Integrity',
    ],
    publishingPrinciples: canonicalUrl('/editorial-policy/'),
    ethicsPolicy: canonicalUrl('/academic-integrity/'),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: canonicalUrl('/contact/'),
    },
  };
}

export function webPageGraphNode({
  name,
  description,
  canonicalPath,
}: {
  name: string;
  description: string;
  canonicalPath: string;
}) {
  const pageUrl = canonicalUrl(canonicalPath);
  return {
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    name,
    url: pageUrl,
    description,
    isPartOf: { '@id': `${canonicalUrl('/')}#website` },
    inLanguage: 'en',
  };
}

export function contactPageGraphNode(canonicalPath = '/contact/') {
  const pageUrl = canonicalUrl(canonicalPath);
  return {
    '@type': 'ContactPage',
    '@id': `${pageUrl}#contactpage`,
    name: `Contact ${siteConfig.name}`,
    url: pageUrl,
    description: `How to contact ${siteConfig.name} with inquiries, corrections, or community removal requests.`,
    isPartOf: { '@id': `${canonicalUrl('/')}#website` },
    inLanguage: 'en',
    mainEntity: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: canonicalUrl('/'),
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: pageUrl,
        availableLanguage: ['en'],
      },
    },
  };
}

export function breadcrumbGraphNode(items: { name: string; path: string }[], pageUrl?: string) {
  const fullItems = [
    { name: 'Home', path: '/' },
    ...items.filter((i) => i.path !== '/' && i.name.toLowerCase() !== 'home'),
  ];
  return {
    '@type': 'BreadcrumbList',
    '@id': pageUrl ? `${pageUrl}#breadcrumb` : undefined,
    itemListElement: fullItems.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

export function faqPageGraphNode(faqs?: { question: string; answer: string }[]) {
  if (!faqs || faqs.length === 0) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function collectionPageGraphNode({
  name,
  description,
  canonicalPath,
  items,
}: {
  name: string;
  description: string;
  canonicalPath: string;
  items: Community[];
}) {
  const pageUrl = canonicalUrl(canonicalPath);
  return {
    '@type': 'CollectionPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name,
    description,
    isPartOf: { '@id': `${canonicalUrl('/')}#website` },
    breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
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
  };
}

export function communityDetailGraphNode(community: Community, pageUrl: string) {
  const examNames = (community.exams ?? []).map(getExamName);
  return {
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: community.title,
    description: communityDescription(community),
    isPartOf: { '@id': `${canonicalUrl('/')}#website` },
    breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
    mainEntity: {
      '@type': 'EducationalOrganization',
      '@id': `${pageUrl}#organization`,
      name: community.title,
      description: community.description ?? `${community.title} study community.`,
      url: pageUrl,
      sameAs: community.inviteUrl,
      knowsAbout: examNames.length > 0 ? examNames : [getCategoryName(community.category)],
      inLanguage: community.language ?? 'en',
      ...(community.memberCount
        ? {
            interactionStatistic: {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/JoinAction',
              userInteractionCount: community.memberCount,
            },
          }
        : {}),
    },
  };
}

export function websiteJsonLd() {
  return graphJsonLd([organizationGraphNode(), websiteGraphNode()]);
}

export function organizationJsonLd() {
  return graphJsonLd([organizationGraphNode()]);
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return graphJsonLd([breadcrumbGraphNode(items)]);
}

export function collectionPageJsonLd(
  name: string,
  description: string,
  items: Community[],
  canonicalPath = '/communities/'
) {
  return graphJsonLd([collectionPageGraphNode({ name, description, canonicalPath, items })]);
}

