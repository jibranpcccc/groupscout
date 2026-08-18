import { detectPlatformFromUrl, isPlatformId } from '../config/platforms';
import type { Platform } from '../types/community';

/**
 * URL normalization for invite links.
 *
 * Rules:
 * - Never modify invitation tokens (Discord codes, WhatsApp group codes).
 * - Lowercase scheme/host; Telegram usernames are case-insensitive so the
 *   path is lowercased for t.me/telegram.me/telegram.dog hosts only.
 * - Strip tracking parameters (utm_*, fbclid, gclid, ...), unrelated query
 *   params and fragments.
 * - Return null for anything that is not a usable http(s) URL.
 */

const TRACKING_PARAMS = /^(utm_[a-z0-9]+|fbclid|gclid|mc_cid|mc_eid|igshid|ref|ref_src|source)$/i;
const TELEGRAM_HOSTS = new Set(['t.me', 'telegram.me', 'telegram.dog']);

export function normalizeInviteUrl(input: string): string | null {
  if (!input) return null;
  let raw = input.trim().replace(/\s+/g, '');

  // Allow paste without scheme.
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (!host) return null;
  // Require a real hostname (dot or localhost) — bare words are not invite URLs.
  if (!host.includes('.') && host !== 'localhost') return null;

  // Drop tracking params and fragments.
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(key)) url.searchParams.delete(key);
  }
  url.hash = '';

  // Telegram usernames are case-insensitive → normalize path for t.me hosts.
  if (TELEGRAM_HOSTS.has(host)) {
    url.pathname = url.pathname.toLowerCase();
  }

  // Preserve the rest of the path/token verbatim (case-sensitive tokens).
  // Keep empty query strings out of the stored form.
  const query = url.searchParams.toString();
  const out = `https://${host}${url.pathname}${query ? `?${query}` : ''}`;
  return out;
}

/**
 * Platform-specific "identity key" used for deduplication — the strongest
 * stable signal we have without joining anything. Returns null when the
 * URL cannot be parsed into a meaningful key.
 */
export function platformIdentityKey(platform: Platform, inviteUrl: string): string | null {
  const url = normalizeInviteUrl(inviteUrl);
  if (!url) return null;

  if (platform === 'telegram') {
    // t.me/<username> (or telegram.me/telegram.dog) — path already lowercased.
    const m = url.match(/^https:\/\/(?:t\.me|telegram\.me|telegram\.dog)\/(?:s\/)?([^/?#]+)/);
    if (!m) return null;
    return `telegram:${m[1]}`;
  }

  if (platform === 'discord') {
    // discord.gg/<code> or discord.com/invite/<code> — code is the token.
    const m = url.match(/\/(?:invite\/)?([A-Za-z0-9_-]{2,16})$/);
    if (!m) return null;
    return `discord:${m[1]}`;
  }

  if (platform === 'whatsapp') {
    // chat.whatsapp.com/<code> — code is case-sensitive; never transform it.
    const m = url.match(/\/chat\.whatsapp\.com\/([A-Za-z0-9_-]{10,})$/);
    if (!m) return null;
    return `whatsapp:${m[1]}`;
  }

  return null;
}

/** Detect platform from URL (config-driven hostname matching). */
export function detectPlatform(url: string): Platform | undefined {
  return detectPlatformFromUrl(url);
}

export function isValidPlatform(value: string): boolean {
  return isPlatformId(value);
}

/** Basic http(s) URL format check (used by schema + candidates). */
export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}
