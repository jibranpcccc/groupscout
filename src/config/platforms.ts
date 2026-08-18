import type { Platform } from '../types/community';

/**
 * Platform configuration — the single source for platform identity,
 * URL hostname patterns, icons and validation adapters. Adding a platform
 * (e.g. reddit, slack) means adding an entry here plus a validation adapter
 * in scripts/validate/ — no component changes required.
 */
export interface PlatformConfig {
  id: Platform;
  name: string;
  /** Hostname patterns used to detect a platform from a URL. */
  hostnamePatterns: string[];
  /** Short factual line for platform pages. No affiliation claims. */
  description: string;
  /** Accent color class names (Tailwind) for badges/icons. */
  color: string;
  /** Icon key resolved by the PlatformBadge component. */
  icon: 'telegram' | 'whatsapp' | 'discord';
  /** Label used for link-status adapter selection. */
  validationAdapter: 'telegram' | 'discord' | 'whatsapp' | 'generic';
}

export const platforms: PlatformConfig[] = [
  {
    id: 'telegram',
    name: 'Telegram',
    hostnamePatterns: ['t.me', 'telegram.me', 'telegram.dog', 'telegram.org'],
    description:
      'Public Telegram channels and groups linked from publicly indexable pages. No groups are joined automatically.',
    color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 border-sky-200 dark:border-sky-800',
    icon: 'telegram',
    validationAdapter: 'telegram',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    hostnamePatterns: ['chat.whatsapp.com', 'wa.me', 'whatsapp.com/channel'],
    description:
      'Public WhatsApp group invite links (chat.whatsapp.com) that are openly indexed. Discovery is limited to public URLs.',
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800',
    icon: 'whatsapp',
    validationAdapter: 'whatsapp',
  },
  {
    id: 'discord',
    name: 'Discord',
    hostnamePatterns: ['discord.gg', 'discord.com/invite', 'discordapp.com/invite'],
    description:
      'Publicly discoverable Discord invite links found on permitted public sources. Server data is never enumerated.',
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800',
    icon: 'discord',
    validationAdapter: 'discord',
  },
];

const platformById = new Map<string, PlatformConfig>(platforms.map((p) => [p.id, p]));

export function getPlatformById(id: string): PlatformConfig | undefined {
  return platformById.get(id);
}

export function isPlatformId(id: string): id is Platform {
  return platformById.has(id);
}

export function getPlatformName(id: string): string {
  return getPlatformById(id)?.name ?? id;
}

/**
 * Detect the platform for a URL by matching hostname patterns.
 * Patterns may include a path (e.g. "discord.com/invite") — those match
 * host + path prefix. Returns undefined when nothing matches.
 */
export function detectPlatformFromUrl(url: string): Platform | undefined {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const path = parsed.pathname.toLowerCase();

  for (const platform of platforms) {
    for (const pattern of platform.hostnamePatterns) {
      const p = pattern.toLowerCase();
      if (p.includes('/')) {
        const slash = p.indexOf('/');
        const patternHost = p.slice(0, slash);
        const patternPath = p.slice(slash + 1);
        const hostMatches = host === patternHost || host.endsWith(`.${patternHost}`);
        if (hostMatches && path.startsWith(`/${patternPath}`)) return platform.id;
      } else if (host === p || host.endsWith(`.${p}`)) {
        return platform.id;
      }
    }
  }
  return undefined;
}
