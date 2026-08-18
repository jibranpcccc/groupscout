/**
 * Generic URL validation for non-platform destinations (unlikely in V1,
 * used as a safe fallback adapter).
 */
import { fetchWithRetry } from './validateUrl';
import type { LinkStatus } from '../../src/types/community';

export async function validateGeneric(url: string): Promise<LinkStatus> {
  const outcome = await fetchWithRetry(url);
  if (outcome.errorKind === 'blocked') return 'unknown';
  if (outcome.errorKind === 'timeout' || outcome.errorKind === 'network') return 'unknown';
  if (outcome.status === 404 || outcome.status === 410) return 'dead';
  if (outcome.ok) return 'active';
  return 'unknown';
}
