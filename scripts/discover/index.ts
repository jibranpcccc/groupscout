/**
 * `npm run discover` — discovery pipeline entry point.
 *
 * Pipeline: query generation → public search sources → candidate URLs →
 * normalization → deduplication → validation → classification → confidence
 * checks → pending (or published when AUTO_PUBLISH_DISCOVERED=true).
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
import { generateQueries } from './generateQueries';
import { GeminiGoogleSearchProvider, isGeminiConfigured } from './geminiSearch';
import { ManualSeedProvider, type DiscoveryProvider, type DiscoveryResult } from './discoverySources';
import { parseCandidates, type ParsedCandidate } from './parseCandidates';
import { dedupeCandidates } from '../data/deduplicate';
import { loadPublished, loadPending, writeJsonAtomic } from '../data/io';
import { classifyCandidate } from '../classify/classifyCommunity';
import { buildCommunityDraft } from '../classify/normalizeMetadata';
import { log, sleep, hasHardRejectContent, findRiskLanguage } from '../utilities';
import { discoveryConfig } from '../../src/config/discovery';
import { validateDataset } from '../../src/lib/schema';
import { mergeCandidateIntoDataset } from '../data/mergeListings';
import type { Community } from '../../src/types/community';

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

async function run(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  log('discover', `mode: ${args.dryRun ? 'DRY-RUN (no writes)' : 'live'}`);
  log(
    'discover',
    `budget: ${discoveryConfig.maxQueriesPerRun} queries max, ${discoveryConfig.maxNewCandidatesPerRun} new candidates max`
  );

  const published = loadPublished() as Community[];
  const pending = loadPending() as Community[];
  log('discover', `existing data: ${published.length} published, ${pending.length} pending`);

  // ---- Query generation ----
  const queries = generateQueries();
  log('discover', `generated ${queries.length} queries`);
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
    log('discover', '  → run with --dry-run to see the pipeline; website works without discovery');
  }
  const seedProvider = new ManualSeedProvider(args.seedsPath);
  const seedResults = seedProvider.getSeedResults();
  if (seedResults.length > 0) {
    providers.push(seedProvider);
    log('discover', `provider: manual-seeds (${seedResults.length} seed URLs)`);
  }

  if (providers.length === 0) {
    log('discover', 'no providers available. Add GEMINI_API_KEY to .env or populate src/data/seeds.json.');
    process.exitCode = 1;
    return;
  }

  // ---- Run searches ----
  const rawResults: DiscoveryResult[] = [];
  let ran = 0;
  for (const query of queries) {
    if (ran >= discoveryConfig.maxQueriesPerRun) break;
    for (const provider of providers) {
      if (provider.name === 'manual-seeds') continue; // seeds returned once below
      const results = await provider.search(query.text);
      if (results.length > 0) {
        rawResults.push(...results.slice(0, discoveryConfig.maxCandidatesPerQuery));
        log('discover', `query "${query.text.slice(0, 60)}" → ${results.length} candidate URL(s)`);
      }
      ran++;
      if (ran >= discoveryConfig.maxQueriesPerRun) break;
      if (discoveryConfig.requestDelayMs > 0) await sleep(discoveryConfig.requestDelayMs);
    }
  }
  rawResults.push(...seedResults);
  log('discover', `found ${rawResults.length} candidate URLs total`);

  // ---- Normalize + parse ----
  const candidates = parseCandidates(rawResults);
  log('discover', `normalized ${candidates.length} usable candidates`);

  if (candidates.length === 0) {
    log('discover', 'no candidates — nothing new to process');
    return;
  }

  // ---- Deduplicate against existing data ----
  const { unique, duplicates, ambiguous } = dedupeCandidates(candidates, [...published, ...pending]);
  log('dedupe', `removed ${duplicates.length} duplicates, ${ambiguous.length} ambiguous → pending review, ${unique.length} new`);

  // ---- Classify + moderate ----
  const takenSlugs = new Set([...published, ...pending].map((c) => c.slug));
  const drafts: Community[] = [];
  let rejected = 0;
  let riskFlagged = 0;

  for (const candidate of unique) {
    const classification = await classifyCandidate({
      candidate,
      anchorCategory: queryAnchorFor(candidate, queries),
    });

    // Internal confidence gate (never shown to users).
    const confidence =
      classification.confidence > 0 ? classification.confidence : candidate.confidence * 0.6;
    if (confidence < 0.4) {
      log('discover', `low confidence (${confidence.toFixed(2)}) — skipping ${candidate.candidateUrl}`);
      rejected++;
      continue;
    }

    const evidenceText = [candidate.candidateUrl, candidate.evidence ?? '', classification.description ?? ''].join(' ');
    if (hasHardRejectContent(evidenceText)) {
      log('discover', `hard-reject content — skipping ${candidate.candidateUrl}`);
      rejected++;
      continue;
    }

    const draft = buildCommunityDraft(candidate, classification, 'ai-tech');
    draft.slug = uniqueSlug(draft.slug, takenSlugs);
    takenSlugs.add(draft.slug);

    const riskFlags = findRiskLanguage(evidenceText);
    if (riskFlags.length > 0) {
      draft.safetyFlags = riskFlags;
      riskFlagged++;
    }

    drafts.push(draft);
    if (args.limit > 0 && drafts.length >= args.limit) break;
    if (drafts.length >= discoveryConfig.maxNewCandidatesPerRun) {
      log('discover', `reached max new candidates per run (${discoveryConfig.maxNewCandidatesPerRun})`);
      break;
    }
    if (discoveryConfig.requestDelayMs > 0) await sleep(discoveryConfig.requestDelayMs);
  }

  log('discover', `classified ${drafts.length} new candidates (${rejected} rejected, ${riskFlagged} risk-flagged)`);

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
        `  - ${d.title} | ${d.platform} | ${d.category} | ${d.inviteUrl}${d.safetyFlags?.length ? ` | flags: ${d.safetyFlags.join(',')}` : ''}`
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

/** Best-effort anchor category from the query that surfaced this candidate. */
function queryAnchorFor(candidate: ParsedCandidate, queries: { text: string; categorySlug: string }[]): string {
  for (const q of queries) {
    if (q.text.includes(new URL(candidate.candidateUrl).hostname)) return q.categorySlug;
  }
  return 'ai-tech';
}

run().catch((err) => {
  console.error(`[discover] fatal: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
  process.exit(1);
});
