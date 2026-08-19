import type { CategorySlug } from '../types/community';

/**
 * Category configuration — the single source for category navigation,
 * category pages and taxonomy. Add/remove entries here without touching
 * any template. Category slugs must be unique and stable.
 */
export interface CategoryConfig {
  slug: CategorySlug;
  name: string;
  /** Short, useful introduction shown on the category page. No filler. */
  description: string;
  /** Tags (subcategories) under this category. Must be unique across categories. */
  tags: string[];
  /** Financial categories render an additional neutral disclaimer. */
  financialDisclaimerRequired: boolean;
  /** Optional distinction of the kind of activity (education/discussion/news/signals). */
  note?: string;
}

export const categories: CategoryConfig[] = [
  {
    slug: 'crypto-web3',
    name: 'Crypto & Web3',
    description:
      'Communities discussing cryptocurrency, blockchain technology, DeFi and Web3 development.',
    tags: [
      'Crypto Discussion',
      'Blockchain',
      'DeFi',
      'Airdrops',
      'Web3 Development',
      'Memecoins',
      'Market Discussion',
    ],
    financialDisclaimerRequired: true,
    note: 'May include discussion, news and education communities. Directory inclusion is not a recommendation to trade.',
  },
  {
    slug: 'forex-stocks',
    name: 'Forex & Stocks',
    description:
      'Communities around forex, stocks, commodities, futures and options — mostly education and market discussion.',
    tags: [
      'Forex',
      'Stocks',
      'Gold',
      'XAUUSD',
      'Futures',
      'Options',
      'Indices',
      'Trading Education',
      'Market Analysis',
    ],
    financialDisclaimerRequired: true,
    note: 'Education, discussion, news and signals communities are labeled distinctly. No financial recommendations are implied.',
  },
  {
    slug: 'ai-tech',
    name: 'AI & Tech',
    description:
      'Communities about artificial intelligence, LLMs, prompt engineering, AI tools and software development.',
    tags: [
      'Artificial Intelligence',
      'ChatGPT',
      'AI Video',
      'AI Images',
      'AI Agents',
      'Automation',
      'Prompt Engineering',
      'Coding',
      'Open Source AI',
      'Machine Learning',
      'Local LLMs',
    ],
    financialDisclaimerRequired: false,
  },
  {
    slug: 'online-earning',
    name: 'Online Earning & Remote Work',
    description:
      'Communities about freelancing, remote jobs, side hustles and building an online business.',
    tags: [
      'Freelancing',
      'Remote Jobs',
      'Side Hustles',
      'Entrepreneurship',
      'Digital Marketing',
      'E-commerce',
      'Creator Economy',
    ],
    financialDisclaimerRequired: true,
    note: 'Earning claims vary widely. Verify any income claims independently.',
  },
  {
    slug: 'deals-coupons',
    name: 'Deals & Coupons',
    description:
      'Communities sharing software deals, SaaS discounts, coupons, freebies and digital product offers.',
    tags: [
      'Software Deals',
      'SaaS Deals',
      'Freebies',
      'Coupons',
      'Shopping Deals',
      'Courses',
      'Digital Products',
    ],
    financialDisclaimerRequired: false,
  },
];

const categoryBySlug = new Map<string, CategoryConfig>(categories.map((c) => [c.slug, c]));

export function getCategoryBySlug(slug: string): CategoryConfig | undefined {
  return categoryBySlug.get(slug);
}

export function isCategorySlug(slug: string): slug is CategorySlug {
  return categoryBySlug.has(slug);
}

export function requiresFinancialDisclaimer(categorySlug: string): boolean {
  return getCategoryBySlug(categorySlug)?.financialDisclaimerRequired ?? false;
}

export function getCategoryName(slug: string): string {
  return getCategoryBySlug(slug)?.name ?? slug;
}

/** All tags across categories — used for tag pages and tag navigation. */
export function getAllTags(): { slug: string; name: string; categorySlug: string }[] {
  const result: { slug: string; name: string; categorySlug: string }[] = [];
  for (const category of categories) {
    for (const tag of category.tags) {
      result.push({ slug: slugifyTag(tag), name: tag, categorySlug: category.slug });
    }
  }
  return result;
}

export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Tag slugs must be unique across the whole site (tag pages are global). */
export function assertTagSlugsUnique(): void {
  const seen = new Map<string, string>();
  for (const category of categories) {
    for (const tag of category.tags) {
      const slug = slugifyTag(tag);
      const existing = seen.get(slug);
      if (existing) {
        throw new Error(
          `Duplicate tag slug "${slug}" (from "${existing}" and "${tag}"). Tag slugs must be globally unique.`
        );
      }
      seen.set(slug, tag);
    }
  }
}
