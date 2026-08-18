/**
 * `npm run approve -- <candidate-id>` — move a pending listing into the
 * published dataset. Idempotent; refuses unknown ids; atomic writes.
 */
import 'dotenv/config';
import { loadPublished, loadPending, writeJsonAtomic } from './io';
import { validateDataset } from '../../src/lib/schema';
import type { Community } from '../../src/types/community';

function main(): void {
  const target = process.argv[2]?.trim();
  if (!target) {
    console.error('Usage: npm run approve -- <candidate-id>');
    process.exit(1);
  }

  const published = loadPublished() as Community[];
  const pending = loadPending() as Community[];

  if (published.some((c) => c.id === target)) {
    console.log(`[approve] "${target}" is already published — nothing to do.`);
    return;
  }

  const record = pending.find((c) => c.id === target);
  if (!record) {
    console.error(`[approve] no pending record with id "${target}".`);
    console.error(`[approve] pending ids: ${pending.map((c) => c.id).join(', ') || '(none)'}`);
    process.exit(1);
  }

  const updated = { ...record, published: true, updatedAt: new Date().toISOString() };
  const nextPublished = [...published, updated];
  const nextPending = pending.filter((c) => c.id !== target);

  const check = validateDataset(nextPublished, nextPending);
  if (!check.ok) {
    console.error('[approve] validation failed — aborting write:');
    for (const err of check.errors) console.error(`  - ${err}`);
    process.exit(1);
  }

  writeJsonAtomic('groups.json', nextPublished);
  writeJsonAtomic('pending-groups.json', nextPending);
  console.log(`[approve] moved "${target}" (${updated.title}) to groups.json (published).`);
  console.log('[approve] NOTE: commit the change to trigger a rebuild.');
}

main();
