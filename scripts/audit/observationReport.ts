/**
 * `npm run observation-report` — 7-day observation yield metrics.
 *
 * Reads the discovery telemetry JSONL logs and computes the yield metrics
 * the owner specified for the observation phase (audit item #31):
 *
 *   A. New Pending / 100 Queries
 *   B. Wrong-Niche Rate
 *   C. Active-Link Rate
 *   D. Specific Exam Classification Rate
 *   E. Duplicate Rate
 *   F. Safety Rejection Rate
 *   G. Pending Approval Rate
 *   H. Provider Yield
 *   I. Platform Yield
 *   J. Exam Yield
 *
 * This is a READ-ONLY aggregation. It never writes to the telemetry files
 * or to any data file. Missing / empty / corrupt JSONL lines are skipped —
 * the report never throws. Divide-by-zero yields 0.
 *
 * Override the telemetry directory with HERMES_TELEMETRY_DIR (used by tests);
 * otherwise it defaults to the repo's audit/telemetry folder.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TELEMETRY_DIR = process.env.HERMES_TELEMETRY_DIR
  ? resolve(process.env.HERMES_TELEMETRY_DIR)
  : resolve(HERE, '../../audit/telemetry');

const QUERY_LOG = resolve(TELEMETRY_DIR, 'query-log.jsonl');
const PROVIDER_LOG = resolve(TELEMETRY_DIR, 'provider-log.jsonl');

export interface QueryRow {
  timestamp?: string;
  query?: string;
  exam?: string | null;
  platform?: string;
  provider?: string;
  timesRun?: number;
  rawCandidateCount?: number;
  passedIntentCount?: number;
  activeCount?: number;
  newPendingCount?: number;
  duplicateCount?: number;
  wrongNicheCount?: number;
}

export interface ProviderRow {
  timestamp?: string;
  provider?: string;
  requests?: number;
  rawCandidates?: number;
  active?: number;
  newPending?: number;
  duplicates?: number;
}

/** Read a JSONL file, skipping empty/corrupt lines. Never throws. */
function readJsonl<T>(path: string): T[] {
  if (!existsSync(path)) return [];
  try {
    const text = readFileSync(path, 'utf-8');
    const rows: T[] = [];
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        rows.push(JSON.parse(trimmed) as T);
      } catch {
        // corrupt line — skip
      }
    }
    return rows;
  } catch {
    return [];
  }
}

export interface ObservationMetrics {
  totalQueries: number;
  totalRaw: number;
  totalPassedIntent: number;
  totalActive: number;
  totalNewPending: number;
  totalDuplicates: number;
  totalWrongNiche: number;
  newPendingPer100Queries: number;
  wrongNicheRate: number;
  activeLinkRate: number;
  specificExamClassificationRate: number;
  duplicateRate: number;
  safetyRejectionRate: number;
  pendingApprovalRate: number;
  providerYield: Record<string, { newPending: number; requests: number; raw: number; pendingPerRequest: number; rawPerRequest: number }>;
  platformYield: Record<string, { newPending: number; raw: number; rate: number }>;
  examYield: Record<string, { newPending: number; raw: number; rate: number }>;
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const pct = (n: number, d: number): number => (d > 0 ? (n / d) * 100 : 0);

/**
 * Compute all observation metrics from the telemetry JSONL files.
 *
 * @param queryRows   pre-loaded query rows (defaults to the telemetry query log)
 * @param providerRows pre-loaded provider rows (defaults to the telemetry provider log)
 * @param queryLogPath optional override for the query-log path (used by tests)
 * @param providerLogPath optional override for the provider-log path
 */
export function computeObservationMetrics(
  queryRows?: QueryRow[],
  providerRows?: ProviderRow[],
  queryLogPath: string = QUERY_LOG,
  providerLogPath: string = PROVIDER_LOG
): ObservationMetrics {
  const q = queryRows ?? readJsonl<QueryRow>(queryLogPath);
  const prov = providerRows ?? readJsonl<ProviderRow>(providerLogPath);
  let totalQueries = 0;
  let totalRaw = 0;
  let totalPassedIntent = 0;
  let totalActive = 0;
  let totalNewPending = 0;
  let totalDuplicates = 0;
  let totalWrongNiche = 0;
  let examTagged = 0;

  const platformNewPending: Record<string, number> = {};
  const platformRaw: Record<string, number> = {};
  const examNewPending: Record<string, number> = {};
  const examRaw: Record<string, number> = {};

  for (const r of q) {
    totalQueries += 1;
    const raw = num(r.rawCandidateCount);
    const passed = num(r.passedIntentCount);
    const active = num(r.activeCount);
    const pending = num(r.newPendingCount);
    const dup = num(r.duplicateCount);
    const wrong = num(r.wrongNicheCount);
    totalRaw += raw;
    totalPassedIntent += passed;
    totalActive += active;
    totalNewPending += pending;
    totalDuplicates += dup;
    totalWrongNiche += wrong;
    if (r.exam) examTagged += 1;

    const plat = r.platform ?? 'unknown';
    platformNewPending[plat] = (platformNewPending[plat] ?? 0) + pending;
    platformRaw[plat] = (platformRaw[plat] ?? 0) + raw;

    if (r.exam) {
      examNewPending[r.exam] = (examNewPending[r.exam] ?? 0) + pending;
      examRaw[r.exam] = (examRaw[r.exam] ?? 0) + raw;
    }
  }

  // Safety rejection = raw that neither passed intent, nor was active, nor
  // duplicate, nor wrong-niche (best-effort remainder).
  const accounted = totalPassedIntent + totalActive + totalDuplicates + totalWrongNiche;
  const safetyRejected = Math.max(0, totalRaw - accounted);

  const providerYield: ObservationMetrics['providerYield'] = {};
  for (const p of prov) {
    const name = p.provider ?? 'unknown';
    const req = num(p.requests);
    const raw = num(p.rawCandidates);
    const pending = num(p.newPending);
    const cur = providerYield[name] ?? { newPending: 0, requests: 0, raw: 0, pendingPerRequest: 0, rawPerRequest: 0 };
    cur.newPending += pending;
    cur.requests += req;
    cur.raw += raw;
    providerYield[name] = cur;
  }
  for (const name of Object.keys(providerYield)) {
    const c = providerYield[name];
    c.pendingPerRequest = pct(c.newPending, c.requests);
    c.rawPerRequest = c.requests > 0 ? c.raw / c.requests : 0;
  }

  const platformYield: ObservationMetrics['platformYield'] = {};
  for (const plat of Object.keys(platformRaw)) {
    platformYield[plat] = {
      newPending: platformNewPending[plat] ?? 0,
      raw: platformRaw[plat],
      rate: pct(platformNewPending[plat] ?? 0, platformRaw[plat]),
    };
  }

  const examYield: ObservationMetrics['examYield'] = {};
  for (const exam of Object.keys(examRaw)) {
    examYield[exam] = {
      newPending: examNewPending[exam] ?? 0,
      raw: examRaw[exam],
      rate: pct(examNewPending[exam] ?? 0, examRaw[exam]),
    };
  }

  return {
    totalQueries,
    totalRaw,
    totalPassedIntent,
    totalActive,
    totalNewPending,
    totalDuplicates,
    totalWrongNiche,
    newPendingPer100Queries: pct(totalNewPending, totalQueries),
    wrongNicheRate: pct(totalWrongNiche, totalRaw),
    activeLinkRate: pct(totalActive, totalRaw),
    specificExamClassificationRate: pct(examTagged, totalQueries),
    duplicateRate: pct(totalDuplicates, totalRaw),
    safetyRejectionRate: pct(safetyRejected, totalRaw),
    pendingApprovalRate: pct(totalNewPending, totalActive),
    providerYield,
    platformYield,
    examYield,
  };
}

/** Format the metrics as a compact human-readable block. */
export function formatObservationReport(m: ObservationMetrics): string {
  const lines: string[] = [];
  lines.push('OBSERVATION PHASE — DISCOVERY YIELD REPORT');
  lines.push('='.repeat(48));
  lines.push(`Queries run:        ${m.totalQueries}`);
  lines.push(`Raw candidates:     ${m.totalRaw}`);
  lines.push(`Passed intent:      ${m.totalPassedIntent}`);
  lines.push(`Active:             ${m.totalActive}`);
  lines.push(`New pending:        ${m.totalNewPending}`);
  lines.push(`Duplicates:         ${m.totalDuplicates}`);
  lines.push(`Wrong-niche:        ${m.totalWrongNiche}`);
  lines.push('-'.repeat(48));
  lines.push(`A. New Pending / 100 Queries:  ${m.newPendingPer100Queries.toFixed(2)}`);
  lines.push(`B. Wrong-Niche Rate:          ${m.wrongNicheRate.toFixed(2)}%`);
  lines.push(`C. Active-Link Rate:          ${m.activeLinkRate.toFixed(2)}%`);
  lines.push(`D. Specific Exam Class. Rate:  ${m.specificExamClassificationRate.toFixed(2)}%`);
  lines.push(`E. Duplicate Rate:            ${m.duplicateRate.toFixed(2)}%`);
  lines.push(`F. Safety Rejection Rate:     ${m.safetyRejectionRate.toFixed(2)}%`);
  lines.push(`G. Pending Approval Rate:     ${m.pendingApprovalRate.toFixed(2)}%`);
  lines.push('-'.repeat(48));
  lines.push('H. Provider Yield (pending / request):');
  for (const [p, v] of Object.entries(m.providerYield)) {
    lines.push(`   ${p.padEnd(22)} pending=${v.newPending} req=${v.requests} (${v.pendingPerRequest.toFixed(2)}%) raw/req=${v.rawPerRequest.toFixed(2)}`);
  }
  lines.push('I. Platform Yield (new pending / raw %):');
  for (const [p, v] of Object.entries(m.platformYield)) {
    lines.push(`   ${p.padEnd(22)} pending=${v.newPending} raw=${v.raw} (${v.rate.toFixed(2)}%)`);
  }
  lines.push('J. Exam Yield (new pending / raw %):');
  for (const [e, v] of Object.entries(m.examYield)) {
    lines.push(`   ${e.padEnd(22)} pending=${v.newPending} raw=${v.raw} (${v.rate.toFixed(2)}%)`);
  }
  return lines.join('\n');
}

function main(): void {
  const metrics = computeObservationMetrics();
  console.log(formatObservationReport(metrics));
}

// Run when invoked directly (not when imported by tests).
const invokedPath = process.argv[1] ? fileURLToPath(import.meta.url) : '';
if (invokedPath && process.argv[1] && fileURLToPath(`file://${process.argv[1]}`) === invokedPath) {
  main();
}
