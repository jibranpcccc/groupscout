/**
 * WhatsApp link validation — extremely cautious by design.
 *
 * chat.whatsapp.com invites are heavily protected; a real invite page
 * renders the WhatsApp join UI. We only classify `active` when the fetch
 * clearly lands on the invite page. Anything ambiguous → `unknown`.
 * We never join the group or touch participants.
 */
import { fetchText } from './validateUrl';
import type { LinkStatus } from '../../src/types/community';

export async function validateWhatsApp(url: string): Promise<LinkStatus> {
  const { text, outcome } = await fetchText(url);

  if (outcome.errorKind === 'timeout' || outcome.errorKind === 'network') return 'unknown';
  if (outcome.errorKind === 'blocked') return 'unknown';
  if (outcome.status === 404 || outcome.status === 410) return 'dead';

  // Invite pages serve the WhatsApp web app shell.
  const looksLikeWhatsApp =
    text.includes('chat.whatsapp.com') ||
    text.includes('whatsapp') && (text.includes('window.__LDP') || text.includes('Join') || text.includes('invite'));

  if (outcome.status === 200 && outcome.finalUrl.includes('chat.whatsapp.com') && looksLikeWhatsApp) {
    return 'active';
  }

  // Redirected away from chat.whatsapp.com usually means invalid/expired,
  // but WhatsApp changes behavior often — treat as unknown, not dead.
  return 'unknown';
}
