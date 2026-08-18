import { platformIdentityKey } from '../../src/lib/urls';
import type { Community } from '../../src/types/community';

/**
 * Deduplication hierarchy for discovery candidates:
 * 1. normalized invite URL
 * 2. platform + normalized community identifier (identity key)
 * 3. Discord guild ID (same real guild, different invite codes)
 * 4. canonical slug
 * 5. highly similar title + same platform + same destination
 *
 * Ambiguous cases are never auto-merged — they are returned separately so
 * the caller can route them to pending review instead of publishing.
 */
export interface DedupeResult<T> {
  unique: T[];
  duplicates: T[];
  ambiguous: T[];
}

function similarity(a: string, b: string): number {
  // Collapse whitespace and drop parenthetical qualifiers ("Lounge (New)")
  // so near-identical titles are recognized — they still only route to
  // ambiguous review, never to auto-merge.
  const normalize = (s: string): string =>
    s
      .toLowerCase()
      .replace(/\([^)]*\)/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (!na || !nb) return 0;
  // Simple bigram Dice coefficient — good enough for near-duplicate titles.
  const bigrams = (s: string): Set<string> => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  };
  const aB = bigrams(na);
  const bB = bigrams(nb);
  let overlap = 0;
  for (const b of bB) if (aB.has(b)) overlap++;
  return (2 * overlap) / (aB.size + bB.size);
}

export function dedupeCandidates<
  T extends {
    candidateUrl: string;
    title?: string;
    platform?: string;
    slug?: string;
    discordGuildId?: string | null;
  }
>(candidates: T[], existing: Community[]): DedupeResult<T> {
  const unique: T[] = [];
  const duplicates: T[] = [];
  const ambiguous: T[] = [];

  // Indexes over existing published data.
  const existingInvite = new Map<string, Community>();
  const existingIdentity = new Map<string, Community>();
  const existingSlugs = new Set(existing.map((c) => c.slug));
  // Discord guild ids seen in existing published/pending records — a real
  // guild id identifies one server regardless of which invite code points
  // at it (codes rotate/expire; the guild id does not).
  const existingDiscordGuildIds = new Set<string>();

  for (const c of existing) {
    existingInvite.set(c.inviteUrl.toLowerCase(), c);
    if (c.platform) {
      const key = platformIdentityKey(c.platform, c.inviteUrl);
      if (key) existingIdentity.set(key, c);
    }
    if (c.platform === 'discord' && c.discordGuildId) {
      existingDiscordGuildIds.add(c.discordGuildId);
    }
  }

  for (const candidate of candidates) {
    const url = candidate.candidateUrl.toLowerCase();

    // 1. Normalized invite URL match.
    const byUrl = existingInvite.get(url);
    if (byUrl) {
      duplicates.push(candidate);
      continue;
    }

    // 2. Platform identity key match (e.g. same t.me username, different URL form).
    if (candidate.platform) {
      const key = platformIdentityKey(candidate.platform as Community['platform'], candidate.candidateUrl);
      if (key && existingIdentity.has(key)) {
        duplicates.push(candidate);
        continue;
      }
    }

    // 3. Discord guild-ID match — a different invite code can point at the
    //    same real guild. Only applies when the candidate carries a factual
    //    guild id (from the official API) and the dataset already has it.
    if (
      candidate.platform === 'discord' &&
      candidate.discordGuildId &&
      existingDiscordGuildIds.has(candidate.discordGuildId)
    ) {
      duplicates.push(candidate);
      continue;
    }

    // 4. Slug collision.
    if (candidate.slug && existingSlugs.has(candidate.slug)) {
      ambiguous.push(candidate);
      continue;
    }

    // 5. Similar title + same platform — ambiguous unless we can verify
    //    the destination is identical (already handled above), so route to
    //    ambiguous rather than auto-dedupe. Titles alone prove nothing.
    const title = candidate.title;
    if (title) {
      const similar = existing.find(
        (c) => c.platform === candidate.platform && similarity(c.title, title) >= 0.92
      );
      if (similar) {
        ambiguous.push(candidate);
        continue;
      }
    }

    unique.push(candidate);
  }

  return { unique, duplicates, ambiguous };
}

export { similarity };
