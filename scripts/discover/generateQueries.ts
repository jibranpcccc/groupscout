/**
 * Deterministic discovery query generation: platform × category × tag
 * combinations with per-platform query templates. Capped by
 * DISCOVERY_MAX_QUERIES. Optional AI-generated variations can be layered
 * on top later; the base set is fully deterministic.
 */
import { categories } from '../../src/config/categories';
import { platforms } from '../../src/config/platforms';
import { discoveryConfig } from '../../src/config/discovery';
import type { Platform } from '../../src/types/community';

export interface DiscoveryQuery {
  platform: Platform;
  categorySlug: string;
  tag: string;
  text: string;
}

function telegramTemplates(tag: string, categoryName: string): string[] {
  return [
    `site:t.me "${tag}"`,
    `site:t.me "${categoryName}" community`,
    `"t.me" ${tag} channel`,
  ];
}

function whatsappTemplates(tag: string, categoryName: string): string[] {
  return [
    `site:chat.whatsapp.com "${tag}"`,
    `site:chat.whatsapp.com "${categoryName}"`,
    `"whatsapp.com" ${tag} group invite`,
  ];
}

function discordTemplates(tag: string, categoryName: string): string[] {
  return [
    `"discord.gg" "${tag}"`,
    `"discord.gg" "${categoryName}" community`,
    `"discord.com/invite" ${tag}`,
  ];
}

const TEMPLATES: Record<Platform, (tag: string, categoryName: string) => string[]> = {
  telegram: telegramTemplates,
  whatsapp: whatsappTemplates,
  discord: discordTemplates,
};

export function generateQueries(): DiscoveryQuery[] {
  const queries: DiscoveryQuery[] = [];

  for (const platform of platforms) {
    for (const category of categories) {
      // Anchor on category tags first (highest signal), then category name.
      const anchors = [...category.tags, category.name];
      for (const anchor of anchors) {
        for (const template of TEMPLATES[platform.id](anchor, category.name)) {
          queries.push({
            platform: platform.id,
            categorySlug: category.slug,
            tag: anchor,
            text: template,
          });
          if (queries.length >= discoveryConfig.maxQueriesPerRun) {
            return queries;
          }
        }
      }
    }
  }

  return queries;
}

export function generateQueryCount(): number {
  return generateQueries().length;
}
