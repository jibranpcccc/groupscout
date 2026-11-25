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

function loadTavilyKeys(): string[] {
  const keys: string[] = [];
  const fromList = (process.env.TAVILY_API_KEYS ?? '')
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  keys.push(...fromList);
  for (let i = 1; i <= 60; i++) {
    const k = process.env[`TAVILY_API_KEY_${i}`];
    if (k && k.trim()) keys.push(k.trim());
  }
  if (keys.length === 0 && process.env.TAVILY_API_KEY?.trim()) {
    keys.push(process.env.TAVILY_API_KEY.trim());
  }
  return keys;
}

let tavilyKeyIdx = 0;

/**
 * Fallback via Tavily Extract when direct t.me connections fail/timeout
 * (e.g. GitHub Actions egress blocks). Only applies to public handles.
 */
async function validateTelegramViaTavily(url: string): Promise<LinkStatus> {
  const match = url.match(/^https?:\/\/t\.me\/(?:s\/)?([A-Za-z0-9_]{3,})$/i);
  if (!match) return 'unknown';

  const handle = match[1];
  if (handle.startsWith('+') || handle.toLowerCase() === 'joinchat') {
    return 'unknown';
  }

  const keys = loadTavilyKeys();
  if (keys.length === 0) return 'unknown';

  const extractUrl = `https://t.me/s/${handle}`;
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const idx = tavilyKeyIdx % keys.length;
    tavilyKeyIdx = (tavilyKeyIdx + 1) >>> 0;
    const apiKey = keys[idx];
    if (!apiKey) continue;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch('https://api.tavily.com/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          urls: [extractUrl],
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.status === 429) continue;
      if (!res.ok) return 'unknown';

      const data = (await res.json()) as {
        results?: Array<{ url?: string; raw_content?: string }>;
      };
      const raw = (data.results?.[0]?.raw_content ?? '').trim();
      if (!raw) return 'unknown';

      const lower = raw.toLowerCase();
      const looksLikeContactPage = CONTACT_PAGE_MARKERS.some((m) => lower.includes(m));
      const hasChannelEvidence =
        /(subscribers|members|subscriber)/.test(lower) ||
        (lower.includes('t.me/s/') && raw.length >= 200);

      if (looksLikeContactPage && !hasChannelEvidence) return 'unknown';
      if (hasChannelEvidence && raw.length >= 200) return 'active';
      return 'unknown';
    } catch {
      clearTimeout(timer);
      continue;
    }
  }

  return 'unknown';
}

export async function validateTelegram(url: string): Promise<LinkStatus> {
  // t.me/<username> web preview works for public channels & groups.
  const previewUrl = url.replace(/\/$/, '') + '?embed=1';
  const { text, outcome } = await fetchText(previewUrl);

  if (
    outcome.errorKind === 'timeout' ||
    outcome.errorKind === 'network' ||
    outcome.errorKind === 'blocked'
  ) {
    return validateTelegramViaTavily(url);
  }
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
