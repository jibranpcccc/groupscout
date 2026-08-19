/**
 * `npm run auto-approve` — gated automatic publishing for the daily pipeline.
 *
 * Moves pending candidates into the published dataset when they satisfy ALL
 * quality gates. Everything else stays pending for human review.
 *
 * Gates (all must pass):
 *  1. production guard      — no demo/sample markers (findProductionViolations)
 *  2. vertical              — must be `study-prep`
 *  3. link status           — must be `active` (anything else, incl. `unknown`,
 *                             stays pending)
 *  4. freshness             — lastCheckedAt exists and is recent (within the
 *                             freshness window [default 7 days, override
 *                             AUTO_APPROVE_FRESHNESS_HOURS], or at/after
 *                             AUTO_APPROVE_SINCE when set)
 *  5. independent source    — at least one sourceUrl whose hostname differs
 *                             from the inviteUrl hostname
 *  6. safety flags          — none (risk-language candidates stay pending)
 *  7. real classification   — Gemini assigned at least one tag
 *  8. exam/cert intent      — at least one exam OR examFamily mapped
 *  9. source evidence       — at least one sourceUrl
 * 10. scam-indicator scan   — title/description blocklist (kept pending)
 * 11. schema + dedupe       — validated before the atomic write
 *
 * Cap: AUTO_APPROVE_MAX per run (default 30) — a runaway discovery run can
 * never flood the site.
 */
import 'dotenv/config';
import { loadPublished, loadPending, writeJsonAtomic } from './io';
import { validateDataset, findProductionViolations } from '../../src/lib/schema';
import type { Community } from '../../src/types/community';

const MAX_PER_RUN = Number(process.env.AUTO_APPROVE_MAX ?? 30);

/** ISO timestamp; when set, records must have been checked at or after it. */
const AUTO_APPROVE_SINCE = process.env.AUTO_APPROVE_SINCE;

/** Freshness window for lastCheckedAt (hours). Default 7 days (168h). */
const FRESHNESS_HOURS = Number(process.env.AUTO_APPROVE_FRESHNESS_HOURS ?? 168);

/** Financial/scam indicators → hold for human review. Never auto-publish. */
const BLOCKLIST =
  /\b(guaranteed profits?|guaranteed returns?|100%\s*win|win rate|risk[- ]?free|double your money|get rich|pump and dump|signals? vip|private signals?|profit signals?|earn \$?\d+[kkm]?\s*(per|a|every) (day|week)|passive income (guaranteed|without))\b/i;

interface GateResult {
  approved: Community[];
  held: { record: Community; reasons: string[] }[];
}

/** Lowercased hostname of a URL, or '' when it cannot be parsed. */
function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function checkGates(record: Community): string[] {
  const reasons: string[] = [];

  if (findProductionViolations([record]).length > 0) reasons.push('production-guard');
  if (record.vertical !== 'study-prep') reasons.push('not-study-prep');
  if (record.linkStatus !== 'active') reasons.push('link-not-active');
  // Freshness: lastCheckedAt must exist and be recent — within FRESHNESS_HOURS,
  // or at/after AUTO_APPROVE_SINCE when the workflow sets it (ISO string compare).
  if (!record.lastCheckedAt) {
    reasons.push('not-recently-checked');
  } else {
    const cutoff =
      AUTO_APPROVE_SINCE ??
      new Date(Date.now() - FRESHNESS_HOURS * 3600 * 1000).toISOString();
    if (record.lastCheckedAt < cutoff) reasons.push('not-recently-checked');
  }
  // Exam/certification intent: a valid study-prep candidate must map at least
  // one exam OR examFamily — generic study/accountability groups never qualify.
  const hasExamIntent = (record.exams ?? []).length > 0 || (record.examFamilies ?? []).length > 0;
  if (!hasExamIntent) reasons.push('no-exam-intent');
  // Independent source: at least one sourceUrl on a different hostname than
  // the inviteUrl (unparseable URLs can't count as independent evidence).
  const inviteHost = hostnameOf(record.inviteUrl);
  const hasIndependentSource =
    inviteHost !== '' &&
    (record.sourceUrls ?? []).some((url) => {
      const host = hostnameOf(url);
      return host !== '' && host !== inviteHost;
    });
  if (!hasIndependentSource) reasons.push('no-independent-source');
  if (record.safetyFlags && record.safetyFlags.length > 0) reasons.push('safety-flags');
  if (!record.tags || record.tags.length < 1) reasons.push('not-classified');
  if (!record.sourceUrls || record.sourceUrls.length < 1) reasons.push('no-source');
  if (!record.title || record.title.length < 2 || record.title.length > 140) reasons.push('bad-title');
  const haystack = `${record.title ?? ''} ${record.description ?? ''}`;
  if (BLOCKLIST.test(haystack)) reasons.push('scam-indicators');
  return reasons;
}

function main(): void {
  const published = loadPublished() as Community[];
  const pending = loadPending() as Community[];

  const result: GateResult = { approved: [], held: [] };
  for (const record of pending) {
    const reasons = checkGates(record);
    if (reasons.length > 0) {
      result.held.push({ record, reasons });
    } else {
      result.approved.push(record);
    }
  }

  // Cap.
  const approved = result.approved.slice(0, MAX_PER_RUN);
  const capped = result.approved.length - approved.length;

  console.log(`[auto-approve] pending: ${pending.length} | approved: ${approved.length}${capped ? ` (${capped} beyond cap ${MAX_PER_RUN}, held)` : ''} | held: ${result.held.length}`);

  for (const { record, reasons } of result.held) {
    console.log(`[auto-approve] held ${record.id} — ${reasons.join(', ')}`);
  }

  if (approved.length === 0) {
    console.log('[auto-approve] nothing to publish — no changes written.');
    return;
  }

  const now = new Date().toISOString();
  const nextPublished = [
    ...published,
    ...approved.map((r) => ({ ...r, published: true, updatedAt: now })),
  ];
  const nextPending = pending.filter(
    (r) => !approved.some((a) => a.id === r.id)
  );

  // Validate everything before writing (schema + cross-record invariants).
  const check = validateDataset(nextPublished, nextPending);
  if (!check.ok) {
    console.error('[auto-approve] validation failed — aborting write:');
    for (const err of check.errors) console.error(`  - ${err}`);
    process.exit(1);
  }
  const guard = findProductionViolations(nextPublished);
  if (guard.length > 0) {
    console.error('[auto-approve] production guard violation — aborting write:');
    for (const v of guard) console.error(`  - ${v.id}: ${v.reason}`);
    process.exit(1);
  }

  writeJsonAtomic('groups.json', nextPublished);
  writeJsonAtomic('pending-groups.json', nextPending);
  console.log(`[auto-approve] published ${approved.length} listing(s) — atomic write complete.`);
  console.log('[auto-approve] commit the change to trigger a rebuild.');
}

main();
