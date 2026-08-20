/**
 * Atomic JSON persistence for dataset files.
 * Pattern: load → validate → modify → validate → write temp → atomic rename.
 * An interrupted run can never corrupt production JSON.
 */
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC_DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'data');

export function dataFilePath(fileName: string): string {
  return join(SRC_DATA_DIR, fileName);
}

export function loadJson<T>(fileName: string): T {
  const raw = readFileSync(dataFilePath(fileName), 'utf-8');
  return JSON.parse(raw) as T;
}

/**
 * Serialize with stable formatting: 2-space indent + trailing newline,
 * and sort records by id so unchanged data produces zero git noise.
 */
export function stableJson(records: { id: string }[]): string {
  const sorted = [...records].sort((a, b) => a.id.localeCompare(b.id));
  return `${JSON.stringify(sorted, null, 2)}\n`;
}

/** Write via temp file + rename. Throws on failure; never leaves partial data. */
export function writeJsonAtomic(fileName: string, records: { id: string }[]): void {
  const target = dataFilePath(fileName);
  const tmp = `${target}.tmp-${process.pid}`;
  writeFileSync(tmp, stableJson(records), 'utf-8');
  renameSync(tmp, target);
}

export function loadPublished(): { id: string }[] {
  return loadJson('groups.json');
}

export function loadPending(): { id: string }[] {
  try {
    return loadJson<{ id: string }[]>('pending-groups.json');
  } catch {
    return [];
  }
}

/** Held records (observation-phase non-active / generic queue, append-only). */
export function loadHeld(): { id: string }[] {
  try {
    return loadJson<{ id: string }[]>('held-groups.json');
  } catch {
    return [];
  }
}

export function loadSeeds(): unknown[] {
  return loadJson('seeds.json');
}

// ---------------------------------------------------------------------------
// Rejected-candidates log (operational record — NOT site data, never rendered).
// ---------------------------------------------------------------------------

export type RejectedReason =
  | 'wrong-niche'
  | 'exam-risk'
  | 'low-confidence'
  | 'hard-reject-content';

export interface RejectedCandidateEntry {
  rejectedAt: string;
  reason: RejectedReason;
  candidateUrl: string;
  sourceUrl: string;
  platform: string;
  title?: string;
}

const REJECTED_FILE = 'rejected-candidates.json';

export function rejectedPath(): string {
  return dataFilePath(REJECTED_FILE);
}

/** Load the log; a missing or empty file is a valid empty log. */
export function loadRejectedCandidates(): RejectedCandidateEntry[] {
  try {
    return loadJson<RejectedCandidateEntry[]>(REJECTED_FILE);
  } catch {
    return [];
  }
}

/** Write the full log atomically (temp file + rename, stable formatting). */
export function writeRejectedCandidates(entries: RejectedCandidateEntry[]): void {
  const target = dataFilePath(REJECTED_FILE);
  const tmp = `${target}.tmp-${process.pid}`;
  writeFileSync(tmp, `${JSON.stringify(entries, null, 2)}\n`, 'utf-8');
  renameSync(tmp, target);
}

/** Bounded append — keeps the last MAX_REJECTED_LOG_ENTRIES entries. */
export function appendRejectedCandidates(entries: RejectedCandidateEntry[]): void {
  if (entries.length === 0) return;
  const existing = loadRejectedCandidates();
  const MAX_REJECTED_LOG_ENTRIES = 5000;
  const combined = [...existing, ...entries];
  writeRejectedCandidates(combined.slice(-MAX_REJECTED_LOG_ENTRIES));
}
