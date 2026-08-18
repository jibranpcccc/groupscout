/**
 * Telegram link validation — public observable signals only.
 *
 * We never join groups. For t.me URLs we fetch the public web preview
 * (t.me/s/<username> style redirects are followed by the fetch itself).
 * A page that renders the public channel/group preview is evidence the
 * destination is reachable. Blocks/timeouts are `unknown`, never `dead`.
 */
import { fetchText } from './validateUrl';
import type { LinkStatus } from '../../src/types/community';

export async function validateTelegram(url: string): Promise<LinkStatus> {
  // t.me/<username> web preview works for public channels & groups.
  const previewUrl = url.replace(/\/$/, '') + '?embed=1';
  const { text, outcome } = await fetchText(previewUrl);

  if (outcome.errorKind === 'timeout' || outcome.errorKind === 'network') return 'unknown';
  if (outcome.errorKind === 'blocked') return 'unknown';
  if (outcome.status === 404 || outcome.status === 410) return 'dead';

  if (outcome.ok || (outcome.status ?? 0) < 500) {
    // Real t.me preview pages contain the telegram widget markers.
    const looksLikeTelegramPage =
      text.includes('tgme_page') || text.includes('telegram.me') || text.includes('tgme_widget_message');
    if (looksLikeTelegramPage) return 'active';
    // Reached a page but ambiguous → unknown, never guess.
    return 'unknown';
  }
  return 'unknown';
}
