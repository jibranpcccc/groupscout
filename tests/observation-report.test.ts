import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { computeObservationMetrics } from '../scripts/audit/observationReport';

/**
 * observation-report tests.
 *
 * Writes synthetic JSONL to a temp dir and points the module at it via
 * HERMES_TELEMETRY_DIR so the real file is never touched.
 */
describe('computeObservationMetrics — yield metrics (item #31)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'obs-report-'));

  beforeAll(() => {
    // Point the module at our synthetic logs via explicit path params
    // (the module resolves its default paths at import time, so tests pass
    // paths directly instead of relying on HERMES_TELEMETRY_DIR timing).
    const queryPath = join(dir, 'query-log.jsonl');
    const providerPath = join(dir, 'provider-log.jsonl');
    const queryLog = [
      { query: 'SAT study Discord', exam: 'sat', platform: 'discord', provider: 'tavily', rawCandidateCount: 3, passedIntentCount: 2, activeCount: 2, newPendingCount: 1, duplicateCount: 0, wrongNicheCount: 1 },
      { query: 'IELTS prep Telegram', exam: 'ielts', platform: 'telegram', provider: 'gemini', rawCandidateCount: 3, passedIntentCount: 2, activeCount: 1, newPendingCount: 1, duplicateCount: 1, wrongNicheCount: 1 },
      { query: 'student server', exam: null, platform: 'discord', provider: 'tavily', rawCandidateCount: 2, passedIntentCount: 0, activeCount: 0, newPendingCount: 0, duplicateCount: 0, wrongNicheCount: 1 },
      { query: 'GRE study', exam: 'gre', platform: 'discord', provider: 'gemini', rawCandidateCount: 2, passedIntentCount: 2, activeCount: 1, newPendingCount: 1, duplicateCount: 0, wrongNicheCount: 0 },
    ];
    const providerLog = [
      { provider: 'tavily', requests: 2, rawCandidates: 5, active: 2, newPending: 1, duplicates: 0 },
      { provider: 'gemini', requests: 2, rawCandidates: 5, active: 2, newPending: 2, duplicates: 1 },
    ];
    writeFileSync(queryPath, queryLog.map((r) => JSON.stringify(r)).join('\n') + '\n');
    writeFileSync(providerPath, providerLog.map((r) => JSON.stringify(r)).join('\n') + '\n');
    writeFileSync(join(dir, 'garbage.jsonl'), 'not json\n');
    (globalThis as Record<string, unknown>).__obsPaths = { queryPath, providerPath };
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
    delete (globalThis as Record<string, unknown>).__obsPaths;
  });

  const metrics = () => {
    const { queryPath, providerPath } = (globalThis as unknown as { __obsPaths: { queryPath: string; providerPath: string } }).__obsPaths;
    return computeObservationMetrics(undefined, undefined, queryPath, providerPath);
  };

  it('reads both logs and skips corrupt lines without throwing', () => {
    const m = metrics();
    expect(m.totalQueries).toBe(4);
    expect(m.totalRaw).toBe(10);
    expect(m.totalPassedIntent).toBe(6);
    expect(m.totalActive).toBe(4);
    expect(m.totalNewPending).toBe(3);
    expect(m.totalDuplicates).toBe(1);
    expect(m.totalWrongNiche).toBe(3);
  });

  it('A. New Pending / 100 Queries = 3/4 * 100 = 75', () => {
    expect(metrics().newPendingPer100Queries).toBeCloseTo(75, 5);
  });

  it('B. Wrong-Niche Rate = 3/10 = 30%', () => {
    expect(metrics().wrongNicheRate).toBeCloseTo(30, 5);
  });

  it('C. Active-Link Rate = 4/10 = 40%', () => {
    expect(metrics().activeLinkRate).toBeCloseTo(40, 5);
  });

  it('D. Specific Exam Classification Rate = 3/4 = 75%', () => {
    expect(metrics().specificExamClassificationRate).toBeCloseTo(75, 5);
  });

  it('E. Duplicate Rate = 1/10 = 10%', () => {
    expect(metrics().duplicateRate).toBeCloseTo(10, 5);
  });

  it('F. Safety Rejection Rate = (10 - 6 - 4 - 1 - 3) <0 → clamped 0%', () => {
    expect(metrics().safetyRejectionRate).toBeCloseTo(0, 5);
  });

  it('G. Pending Approval Rate = 3/4 = 75%', () => {
    expect(metrics().pendingApprovalRate).toBeCloseTo(75, 5);
  });

  it('H. Provider Yield per provider', () => {
    const m = metrics();
    expect(m.providerYield.tavily.newPending).toBe(1);
    expect(m.providerYield.tavily.requests).toBe(2);
    expect(m.providerYield.tavily.pendingPerRequest).toBeCloseTo(50, 5);
    expect(m.providerYield.gemini.newPending).toBe(2);
    expect(m.providerYield.gemini.pendingPerRequest).toBeCloseTo(100, 5);
  });

  it('I. Platform Yield (discord: pending 2 / raw 7 = 28.57%)', () => {
    const m = metrics();
    expect(m.platformYield.discord.raw).toBe(7);
    expect(m.platformYield.discord.newPending).toBe(2);
    expect(m.platformYield.discord.rate).toBeCloseTo((2 / 7) * 100, 4);
  });

  it('J. Exam Yield (sat: pending 1 / raw 3 = 33.33%)', () => {
    const m = metrics();
    expect(m.examYield.sat.raw).toBe(3);
    expect(m.examYield.sat.newPending).toBe(1);
    expect(m.examYield.sat.rate).toBeCloseTo((1 / 3) * 100, 4);
  });

  it('handles missing files gracefully (empty metrics, no throw)', () => {
    const emptyDir = mkdtempSync(join(tmpdir(), 'obs-empty-'));
    const emptyQuery = join(emptyDir, 'query-log.jsonl');
    const emptyProvider = join(emptyDir, 'provider-log.jsonl');
    const m = computeObservationMetrics(undefined, undefined, emptyQuery, emptyProvider);
    expect(m.totalQueries).toBe(0);
    expect(m.newPendingPer100Queries).toBe(0);
    expect(m.wrongNicheRate).toBe(0);
    rmSync(emptyDir, { recursive: true, force: true });
  });
});
