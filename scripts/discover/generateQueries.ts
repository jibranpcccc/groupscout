/**
 * Deterministic discovery query generation for the study-prep niche.
 *
 * Queries are built from the exam registry (src/config/exams.ts): every
 * query combines one exam × one platform × one exam-specific query modifier
 * (e.g. `site:t.me "SAT" prep`). A small experimental tier covers exam-less
 * families (general-study, technology-certifications, professional-licensing)
 * via their family tags plus generic anchors ("exam prep", "study group").
 *
 * Budget allocation (of maxQueries, i.e. DISCOVERY_MAX_SEARCH_QUERIES):
 *   - high-priority exams ≈ 70%
 *   - secondary exams    ≈ 20%
 *   - experimental/general-study ≈ 10%
 *
 * Within a tier, exam × platform cells are interleaved round-robin and
 * platform weights are honored (Discord ≈ 40%, Telegram ≈ 40%, WhatsApp ≈
 * 20%) via a weighted 5-slot platform cycle. Per-exam (and per-family) caps
 * guarantee no single exam can monopolize the tier budget, and per-platform
 * caps guarantee the 40/40/20 split. All fully deterministic.
 *
 * Capped by DISCOVERY_MAX_SEARCH_QUERIES; returns at most `maxQueries`.
 */
import { getExamsByPriority, type ExamConfig } from '../../src/config/exams';
import { examFamilies } from '../../src/config/examFamilies';
import { discoveryConfig } from '../../src/config/discovery';
import type { Platform } from '../../src/types/community';

export interface DiscoveryQuery {
  platform: Platform;
  /** Exam slug when this query targets one specific exam (else undefined). */
  examSlug?: string;
  /** Exam-family slug (the directory category) this query targets. */
  categorySlug: string;
  /** The modifier / tag this query anchors on (diagnostics + analytics). */
  anchor: string;
  text: string;
}

/** Tier weights: high ≈ 70%, secondary ≈ 20%, remainder ≈ 10% experimental. */
const HIGH_WEIGHT = 0.7;
const SECONDARY_WEIGHT = 0.2;

/** Platform budget weights — Discord/Telegram ≈ 40% each, WhatsApp ≈ 20%. */
const PLATFORM_WEIGHTS: Record<Platform, number> = {
  discord: 0.4,
  telegram: 0.4,
  whatsapp: 0.2,
};

/**
 * Interleaved 5-slot weighted cycle: Discord and Telegram appear twice,
 * WhatsApp once — exactly 40/40/20. Alternating order keeps heavy platforms
 * from clustering inside one round.
 */
const PLATFORM_CYCLE: Platform[] = ['discord', 'telegram', 'whatsapp', 'discord', 'telegram'];

/** Platform-specific query templates — anchor search on the platform host. */
const PLATFORM_TEMPLATES: Record<Platform, (anchor: string) => string> = {
  telegram: (anchor) => `site:t.me "${anchor}"`,
  whatsapp: (anchor) => `site:chat.whatsapp.com "${anchor}"`,
  discord: (anchor) => `"discord.gg" "${anchor}"`,
};

/** Per-tier platform query caps so the weighted split holds exactly. */
function platformCapsFor(budget: number): Record<Platform, number> {
  const discord = Math.round(budget * PLATFORM_WEIGHTS.discord);
  const telegram = Math.round(budget * PLATFORM_WEIGHTS.telegram);
  const whatsapp = Math.max(0, budget - discord - telegram);
  return { discord, telegram, whatsapp };
}

function tierBudgets(total: number): { high: number; secondary: number; experimental: number } {
  const high = Math.round(total * HIGH_WEIGHT);
  const secondary = Math.round(total * SECONDARY_WEIGHT);
  const experimental = Math.max(0, total - high - secondary);
  return { high, secondary, experimental };
}

/** A budget cell source — one exam (or family) whose anchors get cycled. */
interface CellKey {
  id: string;
  name: string;
  categorySlug: string;
  examSlug?: string;
  /** Query modifiers (exams) or family tags / generic anchors (experimental). */
  anchors: string[];
}

const HIGH_EXAMS = getExamsByPriority().high;
const SECONDARY_EXAMS = getExamsByPriority().secondary;

/** Exam-less families feed the experimental tier via their tags. */
const EXAMLESS_FAMILIES = examFamilies.filter((f) => f.exams.length === 0);

function examCellKey(exam: ExamConfig): CellKey {
  return {
    id: exam.slug,
    name: exam.name,
    categorySlug: exam.family,
    examSlug: exam.slug,
    anchors: exam.queryModifiers,
  };
}

/** Experimental tier cell keys: exam-less family tags + generic anchors. */
function experimentalCellKeys(): CellKey[] {
  const familyKeys: CellKey[] = EXAMLESS_FAMILIES.map((family) => ({
    id: family.slug,
    name: '',
    categorySlug: family.slug,
    anchors: family.tags,
  }));
  const genericKeys: CellKey[] = ['exam prep', 'study group'].map((anchor) => ({
    id: `general:${anchor}`,
    name: '',
    categorySlug: 'general-study',
    anchors: [anchor],
  }));
  return [...familyKeys, ...genericKeys];
}

/**
 * Fill a tier budget from its cell keys, interleaving round-robin across
 * keys AND platforms. Source order: one round per platform-cycle slot; within
 * a round the platform advances diagonally per key, so a small budget still
 * samples every key exactly once and platforms stay weighted 40/40/20.
 */
function fillTier(budget: number, keys: CellKey[], caps: Record<Platform, number>): DiscoveryQuery[] {
  const out: DiscoveryQuery[] = [];
  if (budget <= 0 || keys.length === 0) return out;

  const capPerKey = Math.max(1, Math.ceil(budget / keys.length));
  const keyCount = new Map<string, number>();
  const platformCount = new Map<Platform, number>(Object.keys(caps).map((p) => [p as Platform, 0]));
  // Per (key × platform) pair: next anchor index + whether the pair is spent.
  const pairState = new Map<string, { nextIndex: number; spent: boolean }>();

  outer: for (let round = 0; round < PLATFORM_CYCLE.length; round++) {
    for (let i = 0; i < keys.length; i++) {
      if (out.length >= budget) break outer;
      const key = keys[i];
      const platform = PLATFORM_CYCLE[(round + i) % PLATFORM_CYCLE.length];

      if ((platformCount.get(platform) ?? 0) >= caps[platform]) continue;
      if ((keyCount.get(key.id) ?? 0) >= capPerKey) continue;

      const pairKey = `${key.id}:${platform}`;
      const state = pairState.get(pairKey) ?? { nextIndex: 0, spent: false };
      if (state.spent) continue;
      if (state.nextIndex >= key.anchors.length) {
        state.spent = true;
        pairState.set(pairKey, state);
        continue;
      }

      const anchor = key.anchors[state.nextIndex];
      state.nextIndex += 1;
      pairState.set(pairKey, state);

      const anchorText = key.name ? `${key.name} ${anchor}` : anchor;
      out.push({
        platform,
        examSlug: key.examSlug,
        categorySlug: key.categorySlug,
        anchor,
        text: PLATFORM_TEMPLATES[platform](anchorText),
      });
      keyCount.set(key.id, (keyCount.get(key.id) ?? 0) + 1);
      platformCount.set(platform, (platformCount.get(platform) ?? 0) + 1);
    }
  }

  return out;
}

/**
 * Generate the full discovery query set: tiered 70/20/10 budget,
 * exam × platform × modifier cells, round-robin interleaved, capped at
 * maxQueries (defaults to DISCOVERY_MAX_SEARCH_QUERIES).
 */
export function generateQueries(opts?: { maxQueries?: number }): DiscoveryQuery[] {
  const maxQueries = opts?.maxQueries ?? discoveryConfig.maxSearchQueries;
  if (maxQueries <= 0) return [];

  const { high, secondary, experimental } = tierBudgets(maxQueries);

  const queries: DiscoveryQuery[] = [
    ...fillTier(high, HIGH_EXAMS.map(examCellKey), platformCapsFor(high)),
    ...fillTier(secondary, SECONDARY_EXAMS.map(examCellKey), platformCapsFor(secondary)),
    ...fillTier(experimental, experimentalCellKeys(), platformCapsFor(experimental)),
  ];

  return queries.slice(0, maxQueries);
}

export function generateQueryCount(): number {
  return generateQueries().length;
}