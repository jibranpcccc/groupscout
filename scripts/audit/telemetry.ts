/**
 * Discovery telemetry — best-effort JSONL audit log for the discovery
 * pipeline (scripts/discover/index.ts).
 *
 * Writes one JSON object per line to:
 *   audit/telemetry/query-log.jsonl    (per-query)
 *   audit/telemetry/provider-log.jsonl (per-provider)
 *
 * Every write is best-effort and MUST never crash the pipeline: a failure
 * (unwritable dir, disk full, malformed env override) logs a warning and
 * returns false. The pipeline keeps running regardless.
 */
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { log } from '../utilities';

/** Repo-root telemetry directory; override for tests: HERMES_TELEMETRY_DIR. */
const TELEMETRY_DIR = process.env.HERMES_TELEMETRY_DIR
  ? resolve(process.env.HERMES_TELEMETRY_DIR)
  : resolve(dirname(fileURLToPath(import.meta.url)), '../../audit/telemetry');

const QUERY_LOG = resolve(TELEMETRY_DIR, 'query-log.jsonl');
const PROVIDER_LOG = resolve(TELEMETRY_DIR, 'provider-log.jsonl');

function ensureDir(): boolean {
  try {
    mkdirSync(TELEMETRY_DIR, { recursive: true });
    return true;
  } catch (err) {
    log('telemetry', `cannot create telemetry dir ${TELEMETRY_DIR}: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

function appendLine(file: string, obj: Record<string, unknown>): boolean {
  try {
    if (!ensureDir()) return false;
    appendFileSync(file, `${JSON.stringify(obj)}\n`, 'utf-8');
    return true;
  } catch (err) {
    log('telemetry', `write failed for ${file}: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

/** One discovery search query and its funnel outcome. */
export interface QueryTelemetry {
  timestamp: string;
  query: string;
  exam: string | null;
  platform: string;
  provider: string;
  /** How many times this exact query text ran across providers this run. */
  timesRun: number;
  rawCandidateCount: number;
  passedIntentCount: number;
  activeCount: number;
  newPendingCount: number;
  duplicateCount: number;
  wrongNicheCount: number;
}

/** Log one query's metrics. Best-effort — never throws. */
export function appendQueryTelemetry(entry: Omit<QueryTelemetry, 'timestamp'>): boolean {
  return appendLine(QUERY_LOG, { timestamp: new Date().toISOString(), ...entry });
}

/** One discovery provider's aggregate outcome for a run. */
export interface ProviderTelemetry {
  timestamp: string;
  provider: string;
  requests: number;
  rawCandidates: number;
  active: number;
  newPending: number;
  duplicates: number;
}

/** Log one provider's aggregate metrics. Best-effort — never throws. */
export function appendProviderTelemetry(entry: Omit<ProviderTelemetry, 'timestamp'>): boolean {
  return appendLine(PROVIDER_LOG, { timestamp: new Date().toISOString(), ...entry });
}
