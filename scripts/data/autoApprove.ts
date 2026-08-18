/**
 * `npm run auto-approve` — gated automatic publishing for the daily pipeline.
 *
 * Moves pending candidates into the published dataset when they satisfy ALL
 * quality gates. Everything else stays pending for human review.
 *
 * Gates (all must pass):
 *  1. production guard      — no demo/sample markers (findProductionViolations)
 *  2. link status           — not `dead`
 *  3. safety flags          — none (risk-language candidates stay pending)
 *  4. real classification   — Gemini assigned at least one tag
 *  5. source evidence       — at least one sourceUrl
 *  6. scam-indicator scan   — title/description blocklist (kept pending)
 *  7. schema + dedupe       — validated before the atomic write
 *
 * Cap: AUTO_APPROVE_MAX per run (default 30) — a runaway discovery run can
 * never flood the site.
 */
import 'dotenv/config';
import { loadPublished, loadPending, writeJsonAtomic } from './io';
import { validateDataset, findProductionViolations } from '../../src/lib/schema';
import type { Community } from '../../src/types/community';

const MAX_PER_RUN = Number(process.env.AUTO_APPROVE_MAX ?? 30);

/** Financial/scam indicators → hold for human review. Never auto-publish. */
const BLOCKLIST =
  /\b(guaranteed profits?|guaranteed returns?|100%\s*win|win rate|risk[- ]?free|double your money|get rich|pump and dump|signals? vip|private signals?|profit signals?|earn \$?\d+[kkm]?\s*(per|a|every) (day|week)|passive income (guaranteed|without))\b/i;

interface GateResult {
  approved: Community[];
  held: { record: Community; reasons: string[] }[];
}

function checkGates(record: Community): string[] {
  const reasons: string[] = [];

  if (findProductionViolations([record]).length > 0) reasons.push('production-guard');
  if (record.linkStatus === 'dead') reasons.push('link-dead');
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
