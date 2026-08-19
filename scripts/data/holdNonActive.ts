/**
 * `npm run hold-non-active` — enforce the observation-phase audit item #4:
 * the normal pending queue (src/data/pending-groups.json) may contain ONLY
 * records whose linkStatus === 'active' AND that have explicit exam/cert
 * focus. Every other record is moved to the held/rejected audit log
 * (src/data/held-groups.json), which is APPENDED to (never overwritten),
 * preserving both the full original record and a `heldReason` string.
 *
 * Move conditions (a record moves if EITHER holds):
 *   1. linkStatus !== 'active'  ('unknown' | 'dead' | 'removed' | 'reported')
 *   2. generic study/accountability with no exam/cert focus:
 *        category === 'general-study'
 *        OR (exams empty AND examFamilies empty
 *            AND title matches /study with me|study together|accountability|productivity/)
 *
 * Reason precedence: a non-active link is the more actionable fact, so when a
 * record is both non-active AND generic-study, the linkStatus reason wins.
 *
 * Both output files are written atomically (temp file + rename), so an
 * interrupted run can never corrupt production JSON. Discovery behaviour,
 * taxonomy, and publishing are untouched — this only re-partitions pending.
 */
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Community } from '../../src/types/community';
import { stableJson } from './io';

const SRC_DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'data');

export const DEFAULT_PENDING_PATH = join(SRC_DATA_DIR, 'pending-groups.json');
export const DEFAULT_HELD_PATH = join(SRC_DATA_DIR, 'held-groups.json');

/** A held record: the full original Community plus the audit reason. */
export interface HeldGroup extends Community {
  heldReason: string;
}

export const LINK_STATUS_REASON_PREFIX =
  ' — moved from normal pending per observation-phase rule (pending must be active-only)';
export const GENERIC_STUDY_REASON = 'generic study/accountability, no exam/cert focus';

const GENERIC_STUDY_TITLE_RE = /study with me|study together|accountability|productivity/i;

/**
 * Returns the heldReason for a record that should be moved, or null if the
 * record is allowed to stay in the normal pending queue.
 */
export function classifyMove(record: Community): string | null {
  // Condition 1 (precedence): anything that is not an active link.
  if (record.linkStatus !== 'active') {
    return `linkStatus=${record.linkStatus}${LINK_STATUS_REASON_PREFIX}`;
  }

  // Condition 2: generic study/accountability with no exam/cert focus.
  const isGenericCategory = record.category === 'general-study';
  const exams = record.exams ?? [];
  const examFamilies = record.examFamilies ?? [];
  const noExamFocus = exams.length === 0 && examFamilies.length === 0;
  const titleMatches = GENERIC_STUDY_TITLE_RE.test(record.title ?? '');
  if (isGenericCategory || (noExamFocus && titleMatches)) {
    return GENERIC_STUDY_REASON;
  }

  return null;
}

/** Write records atomically (temp file + rename) with stable formatting. */
function atomicWrite(path: string, records: { id: string }[]): void {
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, stableJson(records), 'utf-8');
  renameSync(tmp, path);
}

function loadArray<T>(path: string): T[] {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T[];
  } catch {
    return [];
  }
}

export interface HoldResult {
  /** Total pending records examined. */
  checked: number;
  /** Records kept in pending (active + exam/cert-relevant). */
  kept: number;
  /** Records moved to held-groups.json. */
  moved: number;
  /** Held-record count before the move. */
  heldBefore: number;
  /** Held-record count after the move (== heldBefore + moved). */
  heldAfter: number;
}

/**
 * Partition pending-groups.json and enforce the active-only rule.
 *
 * @param opts.pendingPath  Override source pending file (tests use temp copies).
 * @param opts.heldPath     Override target held file (tests use temp copies).
 */
export function holdNonActive(opts: { pendingPath?: string; heldPath?: string } = {}): HoldResult {
  const pendingPath = opts.pendingPath ?? DEFAULT_PENDING_PATH;
  const heldPath = opts.heldPath ?? DEFAULT_HELD_PATH;

  const pending = loadArray<Community>(pendingPath);
  const heldBefore = loadArray<HeldGroup>(heldPath);

  const keep: Community[] = [];
  const move: HeldGroup[] = [];

  for (const record of pending) {
    const reason = classifyMove(record);
    if (reason === null) {
      keep.push(record);
    } else {
      move.push({ ...record, heldReason: reason });
    }
  }

  // Append — never overwrite. Existing held records are preserved as-is.
  const nextHeld = [...heldBefore, ...move];

  atomicWrite(pendingPath, keep);
  atomicWrite(heldPath, nextHeld);

  return {
    checked: pending.length,
    kept: keep.length,
    moved: move.length,
    heldBefore: heldBefore.length,
    heldAfter: nextHeld.length,
  };
}

function main(): void {
  const result = holdNonActive();
  console.log(`[hold-non-active] checked ${result.checked} pending record(s):`);
  console.log(`[hold-non-active]   kept in pending (active + exam/cert focus): ${result.kept}`);
  console.log(`[hold-non-active]   moved to held-groups.json: ${result.moved}`);
  console.log(
    `[hold-non-active]   held-groups.json: ${result.heldBefore} → ${result.heldAfter} (appended, not overwritten)`,
  );
}

main();
