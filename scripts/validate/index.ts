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
import { validateDiscordDetailed, type DiscordCheckResult } from './discord';
import { validateWhatsApp } from './whatsapp';
import { validateGeneric } from './generic';
import { log, sleep } from '../utilities';
import { validationConfig } from '../../src/config/discovery';
import { validateDataset } from '../../src/lib/schema';
import type { Community, LinkStatus } from '../../src/types/community';

type AdapterResult = LinkStatus | DiscordCheckResult;

function statusOf(result: AdapterResult): LinkStatus {
  return typeof result === 'string' ? result : result.status;
}

const ADAPTERS: Record<string, (url: string) => Promise<AdapterResult>> = {
  telegram: validateTelegram,
  // Detailed adapter: official invite API with counts → returns guild name
  // and member count alongside the status (stored with the API URL as source).
  discord: validateDiscordDetailed,
  whatsapp: validateWhatsApp,
  generic: validateGeneric,
};

/**
 * Cautious status transitions (spec §25):
 *   first failure / ambiguity  → unknown (failures+1)
 *   repeated strong 404/410    → dead (failures >= 2)
 *   recovery                   → active (failures reset)
 * Report/removed are moderation states — link checks never overwrite them.
 */
function transition(
  current: LinkStatus,
  observed: LinkStatus,
  failures: number
): { status: LinkStatus; failures: number } {
  if (current === 'reported' || current === 'removed') {
    return { status: current, failures };
  }
  if (observed === 'active') {
    return { status: 'active', failures: 0 };
  }
  if (observed === 'dead') {
    const nextFailures = failures + 1;
    if (current === 'dead' || nextFailures >= 2) {
      return { status: 'dead', failures: nextFailures };
    }
    return { status: 'unknown', failures: nextFailures };
  }
  // Ambiguous/blocked/timeout — never dead, and failures only accumulate
  // on strong evidence (handled above).
  return { status: 'unknown', failures: 0 };
}

async function main(): Promise<void> {
  const published = loadPublished() as Community[];
  const pending = loadPending() as Community[];
  const now = new Date().toISOString();

  let checks = 0;
  const updates = new Map<
    string,
    {
      linkStatus: LinkStatus;
      lastCheckedAt: string;
      linkCheckFailures: number;
      memberCount?: number;
      memberCountSource?: string;
      memberCountCheckedAt?: string;
      discordGuildId?: string;
    }
  >();

  const all = [...published, ...pending];
  for (const community of all) {
    if (validationConfig.maxChecks > 0 && checks >= validationConfig.maxChecks) {
      log('validate', `reached VALIDATE_MAX_CHECKS (${validationConfig.maxChecks})`);
      break;
    }
    if (community.linkStatus === 'removed') continue;

    const adapter = ADAPTERS[community.platform] ?? ADAPTERS.generic;
    let observed: AdapterResult;
    try {
      observed = await adapter(community.inviteUrl);
    } catch {
      observed = 'unknown';
    }

    // Discord's official API returns factual guild data — store it only when
    // the community has no member count yet (with the API URL as source).
    // The guild ID is factual identity data too: stored once (never guessed)
    // so later dedupe can match one real guild across invite codes.
    let memberInfo: {
      memberCount?: number;
      memberCountSource?: string;
      memberCountCheckedAt?: string;
      discordGuildId?: string;
    } = {};
    if (community.platform === 'discord' && typeof observed === 'object') {
      const detailed = observed as DiscordCheckResult;
      if (detailed.guildId && community.discordGuildId == null) {
        memberInfo.discordGuildId = detailed.guildId;
        log('validate', `${community.id}: Discord API returned guild id ${detailed.guildId} — storing for dedupe`);
      }
      if (detailed.memberCount != null && community.memberCount == null && detailed.sourceUrl) {
        memberInfo = {
          ...memberInfo,
          memberCount: detailed.memberCount,
          memberCountSource: detailed.sourceUrl,
          memberCountCheckedAt: new Date().toISOString(),
        };
        log('validate', `${community.id}: Discord API returned guild "${detailed.guildName}" with ${detailed.memberCount} members — storing sourced count`);
      }
    }

    const failures = community.linkCheckFailures ?? 0;
    const { status: nextStatus, failures: nextFailures } = transition(
      community.linkStatus,
      statusOf(observed),
      failures
    );
    if (
      nextStatus !== community.linkStatus ||
      nextFailures !== failures ||
      community.lastCheckedAt !== now ||
      Object.keys(memberInfo).length > 0
    ) {
      updates.set(community.id, {
        linkStatus: nextStatus,
        lastCheckedAt: now,
        linkCheckFailures: nextFailures,
        ...memberInfo,
      });
      if (nextStatus !== community.linkStatus) {
        log('validate', `${community.id}: ${community.linkStatus} → ${nextStatus} (observed ${statusOf(observed)}, failures ${failures}→${nextFailures})`);
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
      if (!u) return c;
      return {
        ...c,
        linkStatus: u.linkStatus,
        lastCheckedAt: u.lastCheckedAt,
        linkCheckFailures: u.linkCheckFailures,
        memberCount: u.memberCount ?? c.memberCount,
        memberCountSource: u.memberCountSource ?? c.memberCountSource,
        memberCountCheckedAt: u.memberCountCheckedAt ?? c.memberCountCheckedAt,
        discordGuildId: u.discordGuildId ?? c.discordGuildId,
      };
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
