/**
 * Deterministic discovery query generation: platform × category × tag
 * combinations with per-platform query templates. Platforms are interleaved
 * round-robin so the first `maxQueries` queries always contain a fair mix of
 * Telegram / Discord / WhatsApp, and no single platform may exceed
 * ceil(maxQueries / #platforms) queries. Capped by DISCOVERY_MAX_SEARCH_QUERIES.
 * Optional AI-generated variations can be layered on top later; the base set
 * is fully deterministic.
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

interface AnchorCell {
  platform: Platform;
  categorySlug: string;
  tag: string;
  categoryName: string;
}

/**
 * Generate the platform × tag query matrix, interleaving platforms
 * round-robin: each round visits every platform in order and takes the next
 * unused tag (anchor) for it, so the first `maxQueries` queries always contain
 * a fair mix of Telegram / Discord / WhatsApp. `maxQueriesPerPlatform` (=
 * ceil(maxQueries / #platforms)) guarantees no single platform dominates.
 */
export function generateQueries(opts?: { maxQueries?: number }): DiscoveryQuery[] {
  const maxQueries = opts?.maxQueries ?? discoveryConfig.maxSearchQueries;
  const maxQueriesPerPlatform = Math.ceil(maxQueries / platforms.length);
  const queries: DiscoveryQuery[] = [];

  // Per-platform ordered list of (category × anchor) cells — same anchors
  // (category tags first, then category name) and template strings as before.
  const cellsByPlatform = new Map<Platform, AnchorCell[]>();
  for (const platform of platforms) {
    const cells: AnchorCell[] = [];
    for (const category of categories) {
      // Anchor on category tags first (highest signal), then category name.
      for (const anchor of [...category.tags, category.name]) {
        cells.push({
          platform: platform.id,
          categorySlug: category.slug,
          tag: anchor,
          categoryName: category.name,
        });
      }
    }
    cellsByPlatform.set(platform.id, cells);
  }

  const nextIndex = new Map<Platform, number>(platforms.map((p) => [p.id, 0]));
  const queriesByPlatform = new Map<Platform, number>(platforms.map((p) => [p.id, 0]));

  while (queries.length < maxQueries) {
    let progressed = false;
    for (const platform of platforms) {
      if (queries.length >= maxQueries) break;
      if ((queriesByPlatform.get(platform.id) ?? 0) >= maxQueriesPerPlatform) continue;
      const cells = cellsByPlatform.get(platform.id)!;
      const idx = nextIndex.get(platform.id)!;
      if (idx >= cells.length) continue;
      const cell = cells[idx];
      nextIndex.set(platform.id, idx + 1);
      for (const text of TEMPLATES[platform.id](cell.tag, cell.categoryName)) {
        if (queries.length >= maxQueries) break;
        if ((queriesByPlatform.get(platform.id) ?? 0) >= maxQueriesPerPlatform) break;
        queries.push({
          platform: cell.platform,
          categorySlug: cell.categorySlug,
          tag: cell.tag,
          text,
        });
        queriesByPlatform.set(platform.id, (queriesByPlatform.get(platform.id) ?? 0) + 1);
        progressed = true;
      }
    }
    // All platforms exhausted or at their per-platform cap.
    if (!progressed) break;
  }

  return queries;
}

export function generateQueryCount(): number {
  return generateQueries().length;
}
