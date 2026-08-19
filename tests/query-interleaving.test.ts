import { describe, it, expect } from 'vitest';
import { generateQueries } from '../scripts/discover/generateQueries';

/**
 * Query-interleaving tests.
 *
 * generateQueries is being rewritten to target exams; the test is written
 * against the agreed signature `generateQueries(opts?: { maxQueries?: number })`
 * and the exam-level assertions are validated at integration time.
 */
describe('generateQueries (platform/exam interleaving)', () => {
  const queries = generateQueries({ maxQueries: 30 });

  it('returns exactly maxQueries queries', () => {
    expect(queries).toHaveLength(30);
  });

  it('covers at least 2 platforms', () => {
    const platforms = new Set(queries.map((q) => q.platform));
    expect(platforms.size).toBeGreaterThanOrEqual(2);
  });

  it('keeps no single platform above 60% of the query budget', () => {
    const counts = new Map<string, number>();
    for (const q of queries) {
      counts.set(q.platform, (counts.get(q.platform) ?? 0) + 1);
    }
    expect(counts.size).toBeGreaterThanOrEqual(2);
    for (const count of counts.values()) {
      expect(count / queries.length).toBeLessThanOrEqual(0.6);
    }
  });

  it('covers at least 3 distinct exams', () => {
    const exams = new Set(
      (queries as { examSlug?: string }[]).map((q) => q.examSlug).filter((e): e is string => Boolean(e))
    );
    expect(exams.size).toBeGreaterThanOrEqual(3);
  });
});