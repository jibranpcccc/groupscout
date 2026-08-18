/**
 * Discord link validation — public invite API only.
 *
 * https://discord.com/api/v10/invites/<code> is Discord's public invite
 * endpoint (the same one the web client uses to render invite pages).
 * A 200 means the invite resolves to a server. 404 = expired/invalid.
 * Rate limits/errors = unknown. We never enumerate server members or join.
 */
import { fetchWithRetry, VALIDATOR_UA } from './validateUrl';
import type { LinkStatus } from '../../src/types/community';

export async function validateDiscord(url: string): Promise<LinkStatus> {
  const match = url.match(/(?:invite\/)?([A-Za-z0-9_-]{2,16})$/);
  if (!match) return 'unknown';

  const code = match[1];
  const apiUrl = `https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=false&with_expiration=false`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': VALIDATOR_UA },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.status === 200) return 'active';
    if (res.status === 404 || res.status === 410) return 'dead';
    if (res.status === 403 || res.status === 429) return 'unknown'; // rate-limited/blocked
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

export { fetchWithRetry };
