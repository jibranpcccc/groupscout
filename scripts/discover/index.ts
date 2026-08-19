/**
 * `npm run discover` — discovery pipeline entry point (study-prep niche).
 *
 * Pipeline: query generation (exam × platform × modifier, tiered 70/20/10
 * budget) → public search sources → candidate URLs → normalization →
 * deduplication → classification → exam-risk screening → relevance filter →
 * confidence checks → pending (or published when AUTO_PUBLISH_DISCOVERED=true).
 *
 * Candidates that fail screening are logged to src/data/rejected-candidates.json
 * (operational record) with a reason: wrong-niche, exam-risk, low-confidence
 * or hard-reject-content. High-risk exam-fraud language (leaked questions,
 * dumps, proxy test takers, bought certificates) is REJECTED — never pending.
 * Risk-flagged language (answer keys, "exam leak", ...) lands in pending with
 * safetyFlags: ["exam-risk-language"] for human review.
 *
 * Discovery is NOT publication: new candidates land in pending-groups.json
 * by default and require human review (`npm run approve -- <id>`).
 *
 * Flags:
 *   --dry-run           plan only, never writes data
 *   --limit <n>         cap total new candidates accepted
 *   --seeds <path>      extra seed file (JSON array, same shape as seeds.json)
 */
import 'dotenv/config';
import { generateQueries, type DiscoveryQuery } from './generateQueries';
import { GeminiGoogleSearchProvider, isGeminiConfigured } from './geminiSearch';
import { BraveSearchProvider, isBraveConfigured } from './braveSearch';
import { TavilySearchProvider, isTavilyConfigured } from './tavilySearch';
import { ManualSeedProvider, type DiscoveryProvider, type DiscoveryResult } from './discoverySources';
import { parseCandidates, type ParsedCandidate } from './parseCandidates';
import { normalizeInviteUrl } from '../data/normalizeUrl';
import { detectPlatform } from '../../src/lib/urls';
import { dedupeCandidates } from '../data/deduplicate';
import {
  loadPublished,
  loadPending,
  writeJsonAtomic,
  appendRejectedCandidates,
  type RejectedCandidateEntry,
} from '../data/io';
import { classifyCandidate } from '../classify/classifyCommunity';
import { buildCommunityDraft } from '../classify/normalizeMetadata';
import { log, sleep, hasHardRejectContent } from '../utilities';
import { classifyExamRisk } from '../safety/examRiskClassifier';
import { discoveryConfig } from '../../src/config/discovery';
import { validateDataset } from '../../src/lib/schema';
import { mergeCandidateIntoDataset } from '../data/mergeListings';
import { getExamName } from '../../src/config/exams';
import { computeFunnel, formatFunnel } from '../audit/funnel';
import {
  appendQueryTelemetry,
  appendProviderTelemetry,
} from '../audit/telemetry';
import type { Community, Platform } from '../../src/types/community';

interface CliArgs {
  dryRun: boolean;
  limit: number;
  seedsPath?: string;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { dryRun: false, limit: 0 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--limit') {
      const n = Number.parseInt(argv[i + 1] ?? '', 10);
      if (Number.isFinite(n) && n > 0) args.limit = n;
      i++;
    } else if (a === '--seeds') {
      args.seedsPath = argv[i + 1];
      i++;
    }
  }
  return args;
}

function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

/** Run-level discovery analytics (query topics + funnel + gate outcomes). */
interface RunAnalytics {
  queriesGenerated: number;
  queryTopics: Map<string, number>;
  providerRequests: number;
  rawCandidates: number;
  invalidUrlCandidates: number;
  unknownPlatformCandidates: number;
  usableCandidates: number;
  duplicates: number;
  ambiguous: number;
  wrongNiche: number;
  lowConfidence: number;
  hardReject: number;
  riskRejected: number;
  riskFlagged: number;
  draftsAccepted: number;
  pendingByExam: Map<string, number>;
  pendingByPlatform: Map<Platform, number>;
}

function newAnalytics(): RunAnalytics {
  return {
    queriesGenerated: 0,
    queryTopics: new Map(),
    providerRequests: 0,
    rawCandidates: 0,
    invalidUrlCandidates: 0,
    unknownPlatformCandidates: 0,
    usableCandidates: 0,
    duplicates: 0,
    ambiguous: 0,
    wrongNiche: 0,
    lowConfidence: 0,
    hardReject: 0,
    riskRejected: 0,
    riskFlagged: 0,
    draftsAccepted: 0,
    pendingByExam: new Map(),
    pendingByPlatform: new Map(),
  };
}

function bump(map: Map<string, number>, key: string, by = 1): void {
  map.set(key, (map.get(key) ?? 0) + by);
}

/** Compact `topic:count` list for the analytics log line. */
function topicSummary<T extends string>(map: Map<T, number>): string {
  if (map.size === 0) return 'none';
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}:${v}`)
    .join(', ');
}

async function run(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  log('discover', `mode: ${args.dryRun ? 'DRY-RUN (no writes)' : 'live'}`);
  log(
    'discover',
    `budget: ${discoveryConfig.maxSearchQueries} search queries max, ${discoveryConfig.maxProviderRequests} provider requests max, ${discoveryConfig.maxNewCandidatesPerRun} new candidates max`
  );

  const published = loadPublished() as Community[];
  const pending = loadPending() as Community[];
  log('discover', `existing data: ${published.length} published, ${pending.length} pending`);

  const analytics = newAnalytics();

  // ---- Query generation (exam × platform × modifier, tiered 70/20/10) ----
  const queries = generateQueries({ maxQueries: discoveryConfig.maxSearchQueries });
  analytics.queriesGenerated = queries.length;
  for (const q of queries) bump(analytics.queryTopics, q.examSlug ?? `general:${q.categorySlug}`);
  log('discover', `generated ${queries.length} queries (topics: ${topicSummary(analytics.queryTopics)})`);
  if (queries.length === 0) {
    log('discover', 'no queries generated — nothing to do');
    return;
  }

  // ---- Providers ----
  const providers: DiscoveryProvider[] = [];
  if (isGeminiConfigured()) {
    providers.push(new GeminiGoogleSearchProvider());
    log('discover', 'provider: gemini-google-search (grounding enabled)');
  } else {
    log('discover', 'provider: gemini-google-search SKIPPED — GEMINI_API_KEY missing or GEMINI_SEARCH_ENABLED=false');
  }
  if (isBraveConfigured()) {
    providers.push(new BraveSearchProvider());
    log('discover', 'provider: brave-search (free tier, BRAVE_API_KEY)');
  }
  if (isTavilyConfigured()) {
    providers.push(new TavilySearchProvider());
    log('discover', 'provider: tavily-search (free tier, TAVILY_API_KEY)');
  }
  const seedProvider = new ManualSeedProvider(args.seedsPath);
  const seedResults = seedProvider.getSeedResults();
  if (seedResults.length > 0) {
    providers.push(seedProvider);
    log('discover', `provider: manual-seeds (${seedResults.length} seed URLs)`);
  }

  if (providers.length === 0) {
    log('discover', 'no providers available. Set GEMINI_API_KEY (paid grounding), BRAVE_API_KEY (free search), or populate src/data/seeds.json.');
    process.exitCode = 1;
    return;
  }

  // ---- Run searches ----
  // maxSearchQueries caps how many DISTINCT query texts are searched;
  // maxProviderRequests separately caps the total number of provider
  // requests (each query is sent to every configured provider).
  const rawResults: DiscoveryResult[] = [];
  let queriesSearched = 0;
  const searchedTexts = new Set<string>();
  // Best-effort telemetry attributions (never affect pipeline behavior).
  const providerRaw = new Map<string, number>(); // provider name -> raw candidates pushed
  const providerRequestCount = new Map<string, number>(); // provider name -> requests
  const providerRawUrls = new Map<string, Set<string>>(); // provider name -> raw candidate URLs pushed
  const queryRawCount = new Map<string, number>(); // query text -> raw candidates pushed
  const queryForRawUrl = new Map<string, string>(); // raw candidateUrl -> query text
  for (const query of queries) {
    if (queriesSearched >= discoveryConfig.maxSearchQueries) break;
    if (searchedTexts.has(query.text)) continue; // count DISTINCT query texts only
    let searched = false;
    for (const provider of providers) {
      if (provider.name === 'manual-seeds') continue; // seeds returned once below
      if (analytics.providerRequests >= discoveryConfig.maxProviderRequests) break;
      const results = await provider.search(query.text);
      analytics.providerRequests++;
      providerRequestCount.set(provider.name, (providerRequestCount.get(provider.name) ?? 0) + 1);
      if (results.length > 0) {
        const kept = results.slice(0, discoveryConfig.maxCandidatesPerQuery);
        rawResults.push(...kept);
        providerRaw.set(provider.name, (providerRaw.get(provider.name) ?? 0) + kept.length);
        const urls = providerRawUrls.get(provider.name) ?? new Set<string>();
        for (const k of kept) urls.add(k.candidateUrl);
        providerRawUrls.set(provider.name, urls);
        queryRawCount.set(query.text, (queryRawCount.get(query.text) ?? 0) + kept.length);
        for (const r of kept) queryForRawUrl.set(r.candidateUrl, query.text);
        log('discover', `query "${query.text.slice(0, 60)}" → ${results.length} candidate URL(s)`);
      }
      searched = true;
      if (analytics.providerRequests >= discoveryConfig.maxProviderRequests) break;
      if (discoveryConfig.requestDelayMs > 0) await sleep(discoveryConfig.requestDelayMs);
    }
    if (searched) {
      searchedTexts.add(query.text);
      queriesSearched++;
    }
    if (analytics.providerRequests >= discoveryConfig.maxProviderRequests) break; // budget exhausted
  }
  rawResults.push(...seedResults);
  analytics.rawCandidates = rawResults.length;
  log('discover', `found ${rawResults.length} candidate URLs total`);

  // ---- Normalize + parse (count what parseCandidates has to drop) ----
  let invalidUrl = 0;
  let unknownPlatform = 0;
  for (const raw of rawResults) {
    const normalized = normalizeInviteUrl(raw.candidateUrl);
    if (!normalized) {
      invalidUrl++;
      continue;
    }
    if (!detectPlatform(normalized)) unknownPlatform++;
  }
  analytics.invalidUrlCandidates = invalidUrl;
  analytics.unknownPlatformCandidates = unknownPlatform;

  const candidates = parseCandidates(rawResults);
  analytics.usableCandidates = candidates.length;
  log(
    'discover',
    `normalized ${candidates.length} usable candidates (${invalidUrl} invalid/dead URLs, ${unknownPlatform} unknown platform)`
  );

  if (candidates.length === 0) {
    log('discover', 'no candidates — nothing new to process');
    return;
  }

  // ---- Deduplicate against existing data ----
  const { unique, duplicates, ambiguous } = dedupeCandidates(candidates, [...published, ...pending]);
  analytics.duplicates = duplicates.length;
  analytics.ambiguous = ambiguous.length;
  // Best-effort per-query attribution for the dedupe stage.
  const queryDuplicates = new Map<string, number>();
  const queryActive = new Map<string, number>();
  const queryPassedIntent = new Map<string, number>();
  const queryWrongNiche = new Map<string, number>();
  for (const dup of [...duplicates, ...ambiguous]) {
    const q = queryTextFor(dup.candidateUrl, queryForRawUrl);
    if (q) queryDuplicates.set(q, (queryDuplicates.get(q) ?? 0) + 1);
  }
  log('dedupe', `removed ${duplicates.length} duplicates, ${ambiguous.length} ambiguous → pending review, ${unique.length} new`);

  // ---- Classify, screen for exam risk, filter by relevance ----
  const takenSlugs = new Set([...published, ...pending].map((c) => c.slug));
  const drafts: Community[] = [];
  const rejectedEntries: RejectedCandidateEntry[] = [];

  for (const candidate of unique) {
    const anchor = queryAnchorFor(candidate, queries);
    const classification = await classifyCandidate({
      candidate,
      anchorCategory: anchor,
    });

    const evidenceText = [candidate.candidateUrl, candidate.evidence ?? '', classification.description ?? ''].join(' ');

    // Relevance filter — keep only explicit exam-prep / study communities.
    const qText = queryTextFor(candidate.candidateUrl, queryForRawUrl);
    if (classification.relevance === false) {
      analytics.wrongNiche++;
      if (qText) queryWrongNiche.set(qText, (queryWrongNiche.get(qText) ?? 0) + 1);
      log('discover', `wrong-niche (relevance=false) — rejecting ${candidate.candidateUrl}`);
      rejectedEntries.push(rejectEntry('wrong-niche', candidate));
      continue;
    }
    if (qText) queryPassedIntent.set(qText, (queryPassedIntent.get(qText) ?? 0) + 1);

    // Internal confidence gate (never shown to users).
    const confidence =
      classification.confidence > 0 ? classification.confidence : candidate.confidence * 0.6;
    if (confidence < 0.4) {
      analytics.lowConfidence++;
      log('discover', `low confidence (${confidence.toFixed(2)}) — rejecting ${candidate.candidateUrl}`);
      rejectedEntries.push(rejectEntry('low-confidence', candidate));
      continue;
    }

    // Obvious-harm check (drugs, stolen cards, malware, ...).
    if (hasHardRejectContent(evidenceText)) {
      analytics.hardReject++;
      log('discover', `hard-reject content — rejecting ${candidate.candidateUrl}`);
      rejectedEntries.push(rejectEntry('hard-reject-content', candidate));
      continue;
    }

    // Exam-risk screen — high-risk is REJECTED (never pending).
    const risk = classifyExamRisk(evidenceText);
    if (risk.level === 'high-risk-reject') {
      analytics.riskRejected++;
      log('discover', `exam-risk (${risk.flags.join(', ')}) — rejecting ${candidate.candidateUrl}`);
      rejectedEntries.push(rejectEntry('exam-risk', candidate));
      continue;
    }

    const draft = buildCommunityDraft(candidate, classification, anchor);
    draft.slug = uniqueSlug(draft.slug, takenSlugs);
    takenSlugs.add(draft.slug);

    // Risk-flagged language → pending with an explicit safety flag for review.
    if (risk.level === 'risk-flagged') {
      draft.safetyFlags = [...new Set([...(draft.safetyFlags ?? []), 'exam-risk-language'])];
      analytics.riskFlagged++;
    }

    drafts.push(draft);
    if (qText) queryActive.set(qText, (queryActive.get(qText) ?? 0) + 1);
    if (args.limit > 0 && drafts.length >= args.limit) break;
    if (drafts.length >= discoveryConfig.maxNewCandidatesPerRun) {
      log('discover', `reached max new candidates per run (${discoveryConfig.maxNewCandidatesPerRun})`);
      break;
    }
    if (discoveryConfig.requestDelayMs > 0) await sleep(discoveryConfig.requestDelayMs);
  }

  analytics.draftsAccepted = drafts.length;
  for (const d of drafts) {
    analytics.pendingByPlatform.set(d.platform, (analytics.pendingByPlatform.get(d.platform) ?? 0) + 1);
    for (const exam of d.exams.length > 0 ? d.exams : ['general-study']) {
      bump(analytics.pendingByExam, exam);
    }
  }

  // ---- Persist the rejected log (operational record; skipped in dry-run) ----
  if (!args.dryRun) {
    appendRejectedCandidates(rejectedEntries);
    if (rejectedEntries.length > 0) {
      log('discover', `logged ${rejectedEntries.length} rejected candidate(s) to rejected-candidates.json`);
    }
  }

  // ---- Sequential funnel summary (auditable — each stage derives from the prior) ----
  const funnel = computeFunnel({
    raw: analytics.rawCandidates,
    normalized: analytics.usableCandidates,
    unique: unique.length,
    finalPending: drafts.length,
    wrongNiche: analytics.wrongNiche,
    lowConfidence: analytics.lowConfidence,
    hardReject: analytics.hardReject,
    riskRejected: analytics.riskRejected,
    duplicates: analytics.duplicates,
    ambiguous: analytics.ambiguous,
    invalidUrl: analytics.invalidUrlCandidates,
    unknownPlatform: analytics.unknownPlatformCandidates,
    riskFlagged: analytics.riskFlagged,
    providerRequests: analytics.providerRequests,
  });
  log('discover', formatFunnel(funnel));
  // ---- Per-query telemetry (best-effort; never crashes the pipeline) ----
  const queryByText = new Map(queries.map((q) => [q.text, q]));
  for (const q of queries) {
    const attr = queryByText.get(q.text);
    if (!attr) continue;
    const rawCount = queryRawCount.get(q.text) ?? 0;
    appendQueryTelemetry({
      query: q.text,
      exam: q.examSlug ?? null,
      platform: q.platform,
      provider: providers.map((p) => p.name).join(','),
      timesRun: providerRequestCount.size > 0 ? 1 : 0,
      rawCandidateCount: rawCount,
      passedIntentCount: queryPassedIntent.get(q.text) ?? 0,
      activeCount: queryActive.get(q.text) ?? 0,
      newPendingCount: queryActive.get(q.text) ?? 0,
      duplicateCount: queryDuplicates.get(q.text) ?? 0,
      wrongNicheCount: queryWrongNiche.get(q.text) ?? 0,
    });
  }
  log('discover', `query telemetry: ${queryRawCount.size} query(ies) with candidates -> audit/telemetry/query-log.jsonl`);

  // ---- Per-provider telemetry (best-effort) ----
  const providerDuplicates = new Map<string, number>();
  for (const dup of [...duplicates, ...ambiguous]) {
    const p = providerForCandidate(dup.candidateUrl, providerRawUrls);
    if (p) providerDuplicates.set(p, (providerDuplicates.get(p) ?? 0) + 1);
  }
  const providerSentToPending = new Map<string, number>();
  for (const d of drafts) {
    const p = providerForCandidate(d.inviteUrl, providerRawUrls);
    if (p) providerSentToPending.set(p, (providerSentToPending.get(p) ?? 0) + 1);
  }
  for (const provider of providers) {
    if (provider.name === 'manual-seeds') continue;
    const requests = providerRequestCount.get(provider.name) ?? 0;
    const raw = providerRaw.get(provider.name) ?? 0;
    appendProviderTelemetry({
      provider: provider.name,
      requests,
      rawCandidates: raw,
      active: providerSentToPending.get(provider.name) ?? 0,
      newPending: providerSentToPending.get(provider.name) ?? 0,
      duplicates: providerDuplicates.get(provider.name) ?? 0,
    });
  }
  log('discover', `provider telemetry: ${providerRequestCount.size} provider(s) -> audit/telemetry/provider-log.jsonl`);

  if (analytics.pendingByPlatform.size > 0) {
    log('discover', `pending by platform: ${topicSummary(analytics.pendingByPlatform)}`);
  }
  if (analytics.pendingByExam.size > 0) {
    const byExam = new Map<string, number>();
    for (const [slug, count] of analytics.pendingByExam) byExam.set(getExamName(slug), count);
    log('discover', `pending by exam: ${topicSummary(byExam)}`);
  }

  // ---- Write (or plan) ----
  if (drafts.length === 0) {
    log('discover', 'no new candidates to write');
    return;
  }

  const targetPublish = discoveryConfig.automaticPublishing;
  log('discover', `target dataset: ${targetPublish ? 'groups.json (AUTO_PUBLISH)' : 'pending-groups.json (review required)'}`);

  if (args.dryRun) {
    log('dry-run', `would add ${drafts.length} record(s) to ${targetPublish ? 'groups.json' : 'pending-groups.json'}:`);
    for (const d of drafts) {
      console.log(
        `  - ${d.title} | ${d.platform} | ${d.category}${d.exams.length ? ` | exams: ${d.exams.join(',')}` : ''} | ${d.inviteUrl}${d.safetyFlags?.length ? ` | flags: ${d.safetyFlags.join(',')}` : ''}`
      );
    }
    log('dry-run', 'no files were modified');
    return;
  }

  const dataset = targetPublish ? published : pending;
  let next = [...dataset];
  for (const draft of drafts) {
    const { merged } = mergeCandidateIntoDataset(next, draft, targetPublish);
    next = merged;
  }

  // Validate before writing — never write invalid data.
  const targetFile = targetPublish ? 'groups.json' : 'pending-groups.json';
  const check = validateDataset(targetPublish ? next : published, targetPublish ? pending : next);
  if (!check.ok) {
    console.error('[discover] validation failed — aborting write:');
    for (const err of check.errors) console.error(`  - ${err}`);
    process.exitCode = 1;
    return;
  }

  writeJsonAtomic(targetFile, next);
  log('discover', `${targetPublish ? 'published' : 'pending'} ${drafts.length} listing(s)`);
  log('discover', `commit the data change to trigger a rebuild (or run npm run approve -- <id> after review)`);
}

function rejectEntry(reason: RejectedCandidateEntry['reason'], candidate: ParsedCandidate): RejectedCandidateEntry {
  return {
    rejectedAt: new Date().toISOString(),
    reason,
    candidateUrl: candidate.candidateUrl,
    sourceUrl: candidate.sourceUrl,
    platform: candidate.platform,
  };
}

/** Best-effort anchor family from the query that surfaced this candidate. */
function queryAnchorFor(candidate: ParsedCandidate, queries: DiscoveryQuery[]): string {
  for (const q of queries) {
    if (q.text.includes(new URL(candidate.candidateUrl).hostname)) return q.categorySlug;
  }
  return 'general-study';
}

/** Best-effort query text for a (normalized) candidate URL. Exact match first, then hostname. */
function queryTextFor(candidateUrl: string, rawByUrl: Map<string, string>): string | undefined {
  const exact = rawByUrl.get(candidateUrl);
  if (exact) return exact;
  try {
    const host = new URL(candidateUrl).hostname;
    for (const [rawUrl, text] of rawByUrl) {
      try {
        if (new URL(rawUrl).hostname === host) return text;
      } catch {
        /* ignore malformed raw url */
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}

/** Best-effort provider name attribution by hostname against surfaced raw URLs. */
function providerForCandidate(
  candidateUrl: string,
  providerRawUrls: Map<string, Set<string>>
): string | undefined {
  try {
    const host = new URL(candidateUrl).hostname;
    for (const [provider, urls] of providerRawUrls) {
      for (const raw of urls) {
        try {
          if (new URL(raw).hostname === host) return provider;
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}

run().catch((err) => {
  console.error(`[discover] fatal: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
  process.exit(1);
});