/**
 * Discovery & validation budget controls.
 * Every limit can be overridden with environment variables so the system
 * stays inexpensive to operate and safe against runaway runs.
 */

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function boolFromEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return raw.toLowerCase() === 'true' || raw === '1';
}

export const discoveryConfig = {
  /** Cap on search queries generated per discovery run. */
  maxQueriesPerRun: intFromEnv('DISCOVERY_MAX_QUERIES', 30),
  /** Cap on candidate URLs kept per query. */
  maxCandidatesPerQuery: intFromEnv('DISCOVERY_MAX_CANDIDATES_PER_QUERY', 10),
  /** Cap on brand-new candidates accepted per run. */
  maxNewCandidatesPerRun: intFromEnv('DISCOVERY_MAX_CANDIDATES', 100),
  /** Delay between network requests (ms) — be polite to sources. */
  requestDelayMs: intFromEnv('DISCOVERY_REQUEST_DELAY_MS', 1200),
  /**
   * When true, newly discovered communities are written directly into
   * groups.json. Keep false (default) so discoveries go to pending-groups.json
   * and are reviewed by a human before publication.
   */
  automaticPublishing: boolFromEnv('AUTO_PUBLISH_DISCOVERED', false),
  /** Gemini search grounding toggle. */
  geminiSearchEnabled: boolFromEnv('GEMINI_SEARCH_ENABLED', true),
  /**
   * Gemini model; configurable via GEMINI_MODEL. Defaults to the lite model:
   * on free tiers it is quota-friendly and its structured-output responses
   * are far more reliable than the full flash models (which can truncate or
   * loop). Works fine for both search-grounding attempts and classification.
   */
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
} as const;

export const validationConfig = {
  /** Delay between link checks (ms). */
  delayMs: intFromEnv('VALIDATE_DELAY_MS', 1500),
  /** Maximum number of links checked per run (0 = unlimited). */
  maxChecks: intFromEnv('VALIDATE_MAX_CHECKS', 200),
  /** Per-request timeout (ms). */
  requestTimeoutMs: intFromEnv('VALIDATE_REQUEST_TIMEOUT_MS', 12000),
  /** Maximum retries per URL for transient failures. */
  maxRetries: 2,
  /** Retry backoff base (ms). */
  retryBackoffMs: 1500,
} as const;

/**
 * Minimum number of listings a tag needs before its tag page is generated.
 * Prevents empty/thin tag pages (configurable via env for future tuning).
 */
export const TAG_PAGE_MIN_COMMUNITIES = 2;

/**
 * Minimum number of REAL published communities a tag page needs before it
 * is indexable (noindex + sitemap exclusion below this). Prevents thin
 * programmatic SEO pages.
 */
export const TAG_PAGE_INDEX_MIN = 5;

/**
 * Minimum number of REAL published communities a category page needs before
 * it is indexable. Empty/near-empty category pages get noindex + sitemap
 * exclusion while still being browsable.
 */
export const CATEGORY_INDEX_MIN = 3;

/** Page size for directory grids / static pagination. */
export const PAGE_SIZE = 24;
