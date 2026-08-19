/**
 * Category configuration — the single source for category navigation,
 * category pages and taxonomy. Derived from the exam-family configuration
 * (src/config/examFamilies.ts): add/remove families there without touching
 * any template. Category slugs must be unique and stable.
 */
import type { CategorySlug } from '../types/community';
import { examFamilies, getExamFamilyName } from './examFamilies';

export interface CategoryConfig {
  slug: CategorySlug;
  name: string;
  /** Short, useful introduction shown on the category page. No filler. */
  description: string;
  /** Tags (subcategories) under this category. Must be unique across categories. */
  tags: string[];
  /** Legacy flag kept false — study directories use the study safety notice instead. */
  financialDisclaimerRequired: boolean;
  /** Optional distinction of the kind of activity. */
  note?: string;
}

export const categories: CategoryConfig[] = examFamilies.map((family) => ({
  slug: family.slug,
  name: family.name,
  description: family.description,
  tags: family.tags,
  financialDisclaimerRequired: false,
  note: 'Exam-prep and certification study communities. Directory inclusion is not an endorsement of materials or claims inside a community.',
}));

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
  return getCategoryBySlug(slug)?.name ?? getExamFamilyName(slug);
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
