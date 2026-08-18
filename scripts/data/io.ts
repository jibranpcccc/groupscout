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
  return loadJson('pending-groups.json');
}

export function loadSeeds(): unknown[] {
  return loadJson('seeds.json');
}
