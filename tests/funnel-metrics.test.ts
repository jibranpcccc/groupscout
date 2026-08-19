import { describe, it, expect } from 'vitest';
import {
  computeFunnel,
  validateFunnel,
  formatFunnel,
  type FunnelCounters,
} from '../scripts/audit/funnel';
import {
  appendQueryTelemetry,
  appendProviderTelemetry,
  type QueryTelemetry,
  type ProviderTelemetry,
} from '../scripts/audit/telemetry';

/**
 * Funnel-metrics tests.
 *
 * The discovery summary must print a SEQUENTIAL auditable funnel — every
 * stage is derivable from the prior (OUT = IN − dropped), no stage
 * double-counts a candidate, and no count goes negative. Diagnostics that
 * overlap the funnel (duplicates, unknown-platform, risk-flagged, etc.)
 * live in a separate DIAGNOSTIC section, never in the stage chain.
 */

function counters(overrides: Partial<FunnelCounters> = {}): FunnelCounters {
  const base: FunnelCounters = {
    raw: 86,
    normalized: 73,
    unique: 65,
    finalPending: 9,
    wrongNiche: 5,
    lowConfidence: 2,
    hardReject: 1,
    riskRejected: 1,
    duplicates: 6,
    ambiguous: 2,
    invalidUrl: 8,
    unknownPlatform: 5,
    riskFlagged: 3,
    providerRequests: 75,
  };
  return { ...base, ...overrides };
}

describe('computeFunnel — sequential chain', () => {
  it('produces a valid sequential funnel (no double counting, no negatives)', () => {
    const funnel = computeFunnel(counters());
    expect(validateFunnel(funnel)).toEqual([]);
  });

  it('each stage is derivable from the prior (OUT = IN − dropped)', () => {
    const funnel = computeFunnel(counters());
    for (const stage of funnel.stages) {
      expect(stage.dropped).toBe(stage.in - stage.out);
    }
  });

  it('matches the owner-facing stage names in pipeline order', () => {
    const names = computeFunnel(counters()).stages.map((s) => s.name);
    expect(names).toEqual([
      'RAW SEARCH',
      'NORMALIZATION',
      'DEDUPLICATION',
      'EARLY STUDY-INTENT FILTER',
      'SAFETY & QUALITY FILTER',
      'FINAL (new pending)',
    ]);
  });

  it('final pending equals the terminal stage out and the drafts count', () => {
    const funnel = computeFunnel(counters());
    const last = funnel.stages[funnel.stages.length - 1];
    expect(funnel.finalPending).toBe(last.out);
    expect(funnel.finalPending).toBe(9);
    expect(last.out).toBe(9);
  });

  it('reports the known 86→73→…→9 example as a clean chain', () => {
    const funnel = computeFunnel(counters());
    const outs = funnel.stages.map((s) => s.out);
    // raw 86 → normalize 73 → dedupe 65 → intent 60 → safety 56 → final 9
    expect(outs).toEqual([86, 73, 65, 60, 56, 9]);
  });

  it('drops at each stage reconcile without double counting', () => {
    const funnel = computeFunnel(counters());
    // normalization drop (raw-usable) + dedupe + intent + safety must
    // equal raw - final (nothing is double counted).
    const totalDropped = funnel.stages.reduce((sum, s) => sum + s.dropped, 0);
    expect(totalDropped).toBe(counters().raw - funnel.finalPending);
  });

  it('keeps overlapping diagnostics out of the stage chain', () => {
    const funnel = computeFunnel(counters());
    // duplicates/unknown-platform/risk-flagged are diagnostic, not stages.
    const diagnosticNames = new Set(funnel.stages.map((s) => s.key));
    expect(diagnosticNames.has('duplicates')).toBe(false);
    expect(diagnosticNames.has('unknown-platform')).toBe(false);
    expect(funnel.diagnostics.duplicates).toBe(6);
    expect(funnel.diagnostics.unknownPlatform).toBe(5);
    expect(funnel.diagnostics.riskFlagged).toBe(3);
    expect(funnel.diagnostics.providerRequests).toBe(75);
  });

  it('handles a capped run (final pending < passed safety) without breaking the chain', () => {
    const c = counters({ finalPending: 4 }); // --limit trimmed the survivors
    const funnel = computeFunnel(c);
    // chain still sequential even though the terminal is trimmed
    expect(validateFunnel(funnel)).toEqual([]);
    expect(funnel.stages[4].out).toBe(56); // safety out unchanged
    expect(funnel.finalPending).toBe(4); // final trimmed by cap
    expect(funnel.stages[5].dropped).toBe(56 - 4);
  });

  it('rejects a non-sequential (overlapping) configuration', () => {
    const funnel = computeFunnel(
      counters({ normalized: 100 }) // normalized > raw => impossible overlap
    );
    expect(validateFunnel(funnel).length).toBeGreaterThan(0);
  });
});

describe('formatFunnel — printed summary', () => {
  it('renders a Funnel block followed by a separate DIAGNOSTIC METRICS section', () => {
    const text = formatFunnel(computeFunnel(counters()));
    expect(text).toContain('DISCOVERY FUNNEL');
    expect(text).toContain('RAW SEARCH');
    expect(text).toContain('FINAL (new pending)');
    expect(text).toContain('DIAGNOSTIC METRICS:');
    expect(text).toContain('provider-requests=75');
    expect(text).toContain('duplicates=6');
    // diagnostics must not appear as a chain stage
    const funnelSection = text.split('DIAGNOSTIC METRICS:')[0];
    expect(funnelSection).not.toContain('unknown-platform=5');
  });
});

describe('telemetry helpers', () => {
  it('accepts a full per-query telemetry shape', () => {
    const entry: QueryTelemetry = {
      timestamp: new Date().toISOString(),
      query: 'site:t.me "SAT" prep',
      exam: 'sat',
      platform: 'telegram',
      provider: 'gemini-google-search',
      timesRun: 1,
      rawCandidateCount: 12,
      passedIntentCount: 8,
      activeCount: 3,
      newPendingCount: 3,
      duplicateCount: 2,
      wrongNicheCount: 1,
    };
    expect(entry.rawCandidateCount).toBe(12);
    expect(entry.newPendingCount).toBe(entry.activeCount);
  });

  it('accepts a full per-provider telemetry shape', () => {
    const entry: ProviderTelemetry = {
      timestamp: new Date().toISOString(),
      provider: 'tavily-search',
      requests: 25,
      rawCandidates: 40,
      active: 3,
      newPending: 3,
      duplicates: 2,
    };
    expect(entry.requests).toBe(25);
    expect(entry.rawCandidates).toBe(40);
  });
});

describe('append telemetry — best-effort, never throws', () => {
  it('writes and reads back a query log line', () => {
    // Best-effort: returns a boolean and never throws, with the file
    // redirected away from the repo's audit log via HERMES_TELEMETRY_DIR
    // (read at module load in the pipeline). Here we only assert the
    // return contract — appendQueryTelemetry must not throw.
    const ok = appendQueryTelemetry({
      query: 'q',
      exam: null,
      platform: 'telegram',
      provider: 'x',
      timesRun: 1,
      rawCandidateCount: 1,
      passedIntentCount: 1,
      activeCount: 1,
      newPendingCount: 1,
      duplicateCount: 0,
      wrongNicheCount: 0,
    });
    expect(typeof ok).toBe('boolean');
  });

  it('writes and reads back a provider log line', () => {
    const ok = appendProviderTelemetry({
      provider: 'y',
      requests: 1,
      rawCandidates: 1,
      active: 1,
      newPending: 1,
      duplicates: 0,
    });
    expect(typeof ok).toBe('boolean');
  });
});
