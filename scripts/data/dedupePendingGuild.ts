/**
 * Post-validation pending dedupe by Discord guild id.
 *
 * Discovery-time dedupe matches invite URLs / identity keys, but Discord
 * invite CODES rotate — the same guild can be discovered via 2-4 different
 * invite codes in one run. The guild id is only known AFTER link validation
 * stores it. This pass collapses pending records that share a guild id,
 * keeping the record with the richest data (guildId + memberCount + source).
 *
 * Appended/merged records are never deleted silently: merged duplicates are
 * logged to stdout with both ids so the change is auditable.
 */
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { log } from '../utilities';

const SRC_DATA = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'data');
const PENDING_PATH = join(SRC_DATA, 'pending-groups.json');

interface PendingRecord {
  id: string;
  discordGuildId?: string | null;
  memberCount?: number | null;
  sourceUrls?: string[];
  [k: string]: unknown;
}

function loadPending(): PendingRecord[] {
  try {
    return JSON.parse(readFileSync(PENDING_PATH, 'utf-8')) as PendingRecord[];
  } catch {
    return [];
  }
}

function savePending(records: PendingRecord[]): void {
  const tmp = `${PENDING_PATH}.tmp-${process.pid}`;
  writeFileSync(tmp, `${JSON.stringify(records, null, 2)}\n`, 'utf-8');
  renameSync(tmp, PENDING_PATH);
}

function score(r: PendingRecord): number {
  return (
    (r.discordGuildId ? 2 : 0) +
    (r.memberCount ? 1 : 0) +
    ((r.sourceUrls?.length ?? 0) > 0 ? 1 : 0)
  );
}

export function dedupePendingByGuild(records: PendingRecord[]): {
  deduped: PendingRecord[];
  merged: [string, string][];
} {
  const byGuild = new Map<string, PendingRecord>();
  const merged: [string, string][] = [];
  const deduped: PendingRecord[] = [];

  for (const rec of records) {
    const gid = rec.discordGuildId;
    if (!gid) {
      deduped.push(rec);
      continue;
    }
    const existing = byGuild.get(gid);
    if (!existing) {
      byGuild.set(gid, rec);
      deduped.push(rec);
    } else {
      // Keep the richer record; log the merge.
      merged.push([existing.id, rec.id]);
      if (score(rec) > score(existing)) {
        const idx = deduped.indexOf(existing);
        deduped[idx] = rec;
        byGuild.set(gid, rec);
      }
    }
  }
  return { deduped, merged };
}

// ---- CLI ----
const records = loadPending();
const { deduped, merged } = dedupePendingByGuild(records);
if (merged.length === 0) {
  log('dedupe-pending', 'no guild duplicates found — pending unchanged');
} else {
  for (const [keep, drop] of merged) {
    log('dedupe-pending', `merged duplicate: kept ${keep} (dropped ${drop})`);
  }
  savePending(deduped);
  log('dedupe-pending', `pending ${records.length} → ${deduped.length}`);
}
