/**
 * Telegram link validation — public observable signals only.
 *
 * We never join groups. For t.me URLs we fetch the public web preview
 * (t.me/s/<username> style redirects are followed by the fetch itself).
 *
 * Rules (audit-hardened):
 * - HTTP 200 alone is NOT enough.
 * - Personal/contact pages ("Contact @", "If you have Telegram, you can
 *   contact", "Send Message") are REJECTED — they prove nothing about a
 *   group/channel.
 * - `active` requires real channel/group evidence: a tgme_page preview with
 *   a title and/or member/subscriber structure.
 * - Anything ambiguous, blocked or timeout → `unknown`. Never guess.
 */
import { fetchText } from './validateUrl';
import type { LinkStatus } from '../../src/types/community';

const CONTACT_PAGE_MARKERS = [
  'if you have telegram, you can contact',
  'contact @',
  'send message',
  'this user has no public channel',
  'you can contact',
];

export async function validateTelegram(url: string): Promise<LinkStatus> {
  // t.me/<username> web preview works for public channels & groups.
  const previewUrl = url.replace(/\/$/, '') + '?embed=1';
  const { text, outcome } = await fetchText(previewUrl);

  if (outcome.errorKind === 'timeout' || outcome.errorKind === 'network') return 'unknown';
  if (outcome.errorKind === 'blocked') return 'unknown';
  if (outcome.status === 404 || outcome.status === 410) return 'dead';

  if (!(outcome.ok || (outcome.status ?? 0) < 500)) return 'unknown';

  const page = text.toLowerCase();
  const isTelegramPreview =
    page.includes('tgme_page') || page.includes('tgme_widget_message') || page.includes('telegram.me');

  if (!isTelegramPreview) return 'unknown';

  // Personal/contact pages are NOT channel evidence → unknown.
  const looksLikeContactPage = CONTACT_PAGE_MARKERS.some((m) => page.includes(m));
  const hasChannelStructure =
    page.includes('tgme_page_title') || // real channel/group preview header
    /(subscribers|members|subscriber)/.test(page) ||
    page.includes('tgme_channel_info');

  if (looksLikeContactPage && !hasChannelStructure) return 'unknown';

  if (hasChannelStructure) return 'active';

  return 'unknown';
}
