/**
 * `npm run validate-data` — validate all JSON datasets against the runtime
 * schema and cross-record invariants. Fails (exit 1) on malformed data so
 * CI and the build never run on corrupt production JSON.
 */
import 'dotenv/config';
import { loadPublished, loadPending, loadSeeds } from './io';
import { validateDataset } from '../../src/lib/schema';
import { assertTagSlugsUnique } from '../../src/config/categories';

function main(): void {
  let failed = false;

  // Category config integrity.
  try {
    assertTagSlugsUnique();
    console.log('[validate] category config OK (slugs + tags unique)');
  } catch (err) {
    console.error(`[validate] CONFIG ERROR: ${(err as Error).message}`);
    failed = true;
  }

  const published = loadPublished();
  const pending = loadPending();
  const seeds = loadSeeds() as { candidateUrl?: unknown }[];

  const result = validateDataset(published, pending);
  if (result.ok) {
    console.log(
      `[validate] OK — ${result.publishedCount} published, ${result.pendingCount} pending records valid`
    );
  } else {
    failed = true;
    console.error(`[validate] FAILED — ${result.errors.length} issue(s):`);
    for (const err of result.errors) console.error(`  - ${err}`);
  }

  // Seeds file: light validation (it is developer input, not production data).
  for (const [i, seed] of seeds.entries()) {
    if (!seed?.candidateUrl || typeof seed.candidateUrl !== 'string') {
      console.error(`[validate] seeds.json #${i}: missing candidateUrl`);
      failed = true;
    }
  }

  if (failed) {
    console.error('[validate] data validation FAILED');
    process.exit(1);
  }
  console.log('[validate] data validation PASSED');
}

main();
