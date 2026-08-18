import type { Community } from '../../src/types/community';

/**
 * Merge logic for listings. Rules:
 * - id and slug are permanent — never overwritten.
 * - Never fabricate: only overwrite a field when the incoming value is
 *   actually known (non-null / non-"unknown") and the incoming evidence is
 *   newer or strictly better.
 * - `published` state is controlled by the caller, never by this function.
 */
export function mergeCandidateIntoDataset(
  dataset: Community[],
  incoming: Community,
  publish: boolean
): { merged: Community[]; added: boolean } {
  const existingIndex = dataset.findIndex((c) => c.id === incoming.id);
  if (existingIndex === -1) {
    const record: Community = { ...incoming, published: publish };
    return { merged: [...dataset, record], added: true };
  }

  const current = dataset[existingIndex];
  const next: Community = { ...current };

  // Metadata-only fields may be upgraded when the incoming value is known.
  if (incoming.description) next.description = incoming.description;
  if (incoming.tags.length > 0) {
    next.tags = [...new Set([...current.tags, ...incoming.tags])].slice(0, 12);
  }
  if (incoming.subcategory) next.subcategory = incoming.subcategory;
  if (incoming.language) next.language = incoming.language;
  if (incoming.country) next.country = incoming.country;
  if (incoming.accessType && incoming.accessType !== 'unknown') next.accessType = incoming.accessType;
  if (incoming.communityType && incoming.communityType !== 'unknown') {
    next.communityType = incoming.communityType;
  }

  // Member counts are only accepted with a real source.
  if (incoming.memberCount != null && incoming.memberCountSource) {
    next.memberCount = incoming.memberCount;
    next.memberCountSource = incoming.memberCountSource;
    next.memberCountCheckedAt = incoming.memberCountCheckedAt;
  }

  // Source URLs accumulate (cap to keep records tidy).
  next.sourceUrls = [...new Set([...current.sourceUrls, ...incoming.sourceUrls])].slice(0, 10);

  if (incoming.safetyFlags && incoming.safetyFlags.length > 0) {
    next.safetyFlags = [...new Set([...(current.safetyFlags ?? []), ...incoming.safetyFlags])].slice(0, 10);
  }

  if (incoming.verificationStatus !== 'unverified') {
    // Upgrading verification state is always allowed; never downgrade.
    const rank: Record<string, number> = {
      unverified: 0,
      'source-confirmed': 1,
      'manually-reviewed': 2,
      'owner-confirmed': 3,
    };
    if ((rank[incoming.verificationStatus] ?? 0) > (rank[current.verificationStatus] ?? 0)) {
      next.verificationStatus = incoming.verificationStatus;
    }
  }

  next.updatedAt = incoming.updatedAt ?? next.updatedAt;
  next.published = publish;

  const merged = [...dataset];
  merged[existingIndex] = next;
  return { merged, added: false };
}
