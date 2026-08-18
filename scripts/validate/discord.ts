/**
 * Discord link validation — official public invite API.
 *
 * https://discord.com/api/v10/invites/<code> is Discord's public invite
 * endpoint (the same one the web client uses to render invite pages).
 * with_counts=true returns the guild name and approximate member counts.
 *
 * - 200 + legitimate guild object → active; guild name / member count are
 *   factual data returned BY THE API and may be stored with the API URL
 *   as the source.
 * - 404/410 → dead (expired/invalid invite).
 * - Rate limits / errors → unknown. We never enumerate server members or
 *   join anything.
 */
import { fetchWithRetry, VALIDATOR_UA } from './validateUrl';
import type { LinkStatus } from '../../src/types/community';

export interface DiscordCheckResult {
  status: LinkStatus;
  guildName?: string | null;
  /** Real Discord guild (server) id from the API — factual, never guessed. */
  guildId?: string | null;
  memberCount?: number | null;
  /** API URL that returned the data — usable as a memberCountSource. */
  sourceUrl?: string | null;
}

export async function validateDiscordDetailed(url: string): Promise<DiscordCheckResult> {
  const match = url.match(/(?:invite\/)?([A-Za-z0-9_-]{2,16})$/);
  if (!match) return { status: 'unknown' };

  const code = match[1];
  const apiUrl = `https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true&with_expiration=true`;
  const empty: DiscordCheckResult = { status: 'unknown' };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': VALIDATOR_UA },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.status === 404 || res.status === 410) return { status: 'dead' };
    if (res.status === 403 || res.status === 429) return empty; // rate-limited/blocked
    if (res.status !== 200) return empty;

    const data = (await res.json()) as {
      guild?: { id?: string; name?: string; approximate_member_count?: number } | null;
    };

    // A legitimate invite must resolve to a guild (server). Invites without
    // a guild (e.g. group DMs) are not directory material.
    if (!data.guild?.name) return { status: 'unknown' };

    const result: DiscordCheckResult = {
      status: 'active',
      guildName: data.guild.name ?? null,
      guildId: data.guild.id ?? null,
      memberCount:
        typeof data.guild.approximate_member_count === 'number'
          ? data.guild.approximate_member_count
          : null,
      sourceUrl: apiUrl,
    };
    return result;
  } catch {
    return empty;
  }
}

export async function validateDiscord(url: string): Promise<LinkStatus> {
  return (await validateDiscordDetailed(url)).status;
}

export { fetchWithRetry };
