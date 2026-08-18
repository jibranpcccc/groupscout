/**
 * `npm run validate-links` — link health engine.
 *
 * Checks stored destination URLs using platform adapters. Cautious
 * transitions only:
 *   first failure / ambiguity        → unknown
 *   repeated strong 404/invalid      → dead
 *   manual report                    → reported (never set here)
 *   confirmed removed by moderation  → removed (never set here)
 *
 * A single failed request NEVER marks anything dead. Bot-blocking is
 * always `unknown`. Every check stamps lastCheckedAt.
 */
import 'dotenv/config';
import { loadPublished, loadPending, writeJsonAtomic } from '../data/io';
import { validateTelegram } from './telegram';
import { validateDiscord } from './discord';
import { validateWhatsApp } from './whatsapp';
import { validateGeneric } from './generic';
import { log, sleep } from '../utilities';
import { validationConfig } from '../../src/config/discovery';
import { validateDataset } from '../../src/lib/schema';
import type { Community, LinkStatus } from '../../src/types/community';

const ADAPTERS: Record<string, (url: string) => Promise<LinkStatus>> = {
  telegram: validateTelegram,
  discord: validateDiscord,
  whatsapp: validateWhatsApp,
  generic: validateGeneric,
};

function transition(current: LinkStatus, observed: LinkStatus): LinkStatus {
  // Report/removed are moderation states — link checks never overwrite them.
  if (current === 'reported' || current === 'removed') return current;
  if (observed === 'active') return 'active';
  if (observed === 'dead') {
    // Only escalate to dead if we already had evidence of trouble.
    if (current === 'dead' || current === 'unknown') return 'dead';
    return 'unknown';
  }
  return 'unknown';
}

async function main(): Promise<void> {
  const published = loadPublished() as Community[];
  const pending = loadPending() as Community[];
  const now = new Date().toISOString();

  let checks = 0;
  const updates = new Map<string, { linkStatus: LinkStatus; lastCheckedAt: string }>();

  const all = [...published, ...pending];
  for (const community of all) {
    if (validationConfig.maxChecks > 0 && checks >= validationConfig.maxChecks) {
      log('validate', `reached VALIDATE_MAX_CHECKS (${validationConfig.maxChecks})`);
      break;
    }
    if (community.linkStatus === 'removed') continue;

    const adapter = ADAPTERS[community.platform] ?? ADAPTERS.generic;
    let observed: LinkStatus;
    try {
      observed = await adapter(community.inviteUrl);
    } catch {
      observed = 'unknown';
    }

    const nextStatus = transition(community.linkStatus, observed);
    if (nextStatus !== community.linkStatus || community.lastCheckedAt !== now) {
      updates.set(community.id, { linkStatus: nextStatus, lastCheckedAt: now });
      if (nextStatus !== community.linkStatus) {
        log('validate', `${community.id}: ${community.linkStatus} → ${nextStatus} (observed ${observed})`);
      }
    }

    checks++;
    if (validationConfig.delayMs > 0) await sleep(validationConfig.delayMs);
  }

  log('validate', `checked ${checks} link(s), ${updates.size} record(s) changed`);

  if (updates.size === 0) {
    log('validate', 'no status changes — nothing to write');
    return;
  }

  const apply = (records: Community[]): Community[] =>
    records.map((c) => {
      const u = updates.get(c.id);
      return u ? { ...c, linkStatus: u.linkStatus, lastCheckedAt: u.lastCheckedAt } : c;
    });

  const nextPublished = apply(published);
  const nextPending = apply(pending);

  const check = validateDataset(nextPublished, nextPending);
  if (!check.ok) {
    console.error('[validate] validation failed — aborting write:');
    for (const err of check.errors) console.error(`  - ${err}`);
    process.exit(1);
  }

  writeJsonAtomic('groups.json', nextPublished);
  writeJsonAtomic('pending-groups.json', nextPending);
  log('validate', 'wrote updated link statuses (atomic)');
  log('validate', 'commit the change to trigger a rebuild');
}

main().catch((err) => {
  console.error(`[validate] fatal: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
  process.exit(1);
});
