/**
 * Discovery funnel — sequential, auditable stage model for the study-prep
 * discovery pipeline (scripts/discover/index.ts).
 *
 * The pipeline executes its stages in THIS order, so the funnel below is
 * presented in the same order the code applies them. Each stage's OUT is
 * exactly the prior stage's IN minus the candidates dropped by that stage —
 * there is no double counting and the math always chains:
 *
 *   raw ──normalize──▶ normalized ──dedupe──▶ unique
 *       ──intent──▶ passedIntent ──safety──▶ passedSafety ──▶ finalPending
 *
 * Diagnostic counters (providerRequests, unknownPlatform, riskFlagged,
 * ambiguous, etc.) are intentionally NOT stages — they overlap the funnel
 * and belong to a separate diagnostic section, not the stage chain.
 */

export interface FunnelCounters {
  /** Raw candidate URLs surfaced by search + seeds (RAW SEARCH out). */
  raw: number;
  /** Candidates surviving normalization/parsing (NORMALIZATION out). */
  normalized: number;
  /** Candidates surviving deduplication (DEDUPLICATION out). */
  unique: number;
  /** New candidates written to pending (FINAL out). */
  finalPending: number;

  // Rejection / drop counters (the source of truth for the stage drops).
  // INTERMEDIATE stages (study-intent, safety) are derived from these, so
  // the printed chain is always self-consistent and never double-counts.
  wrongNiche: number;
  lowConfidence: number;
  hardReject: number;
  riskRejected: number;
  duplicates: number;
  ambiguous: number;

  // Diagnostic (overlapping — reported separately, not in the chain).
  invalidUrl: number;
  unknownPlatform: number;
  riskFlagged: number;
  providerRequests: number;
}

export interface FunnelStage {
  /** Owner-facing stage name. */
  name: string;
  /** Stable machine key. */
  key: string;
  /** Candidates entering this stage (== prior stage OUT). */
  in: number;
  /** Candidates surviving this stage (== next stage IN). */
  out: number;
  /** Candidates dropped by this stage (== in - out, always >= 0). */
  dropped: number;
}

export interface DiscoveryFunnel {
  stages: FunnelStage[];
  /** Terminal pending count (== last stage OUT). */
  finalPending: number;
  diagnostics: {
    invalidUrl: number;
    unknownPlatform: number;
    duplicates: number;
    ambiguous: number;
    wrongNiche: number;
    lowConfidence: number;
    hardReject: number;
    riskRejected: number;
    riskFlagged: number;
    providerRequests: number;
  };
}

/**
 * Build the sequential funnel from the pipeline counters.
 *
 * The chain is derived exclusively from the drop counters so every stage's
 * OUT is exactly the prior IN minus that stage's dropped candidates — the
 * printed funnel is always self-consistent and never double-counts:
 *
 *   normalizationDrop = raw - normalized
 *   dedupeDrop        = duplicates + ambiguous
 *   intentDrop        = wrongNiche
 *   safetyDrop        = lowConfidence + hardReject + riskRejected
 *
 *   normalized   = raw - normalizationDrop
 *   unique       = normalized - dedupeDrop
 *   passedIntent = unique - intentDrop
 *   passedSafety = passedIntent - safetyDrop
 *   finalPending = passedSafety ... then trimmed by any --limit / cap.
 *
 * When the run is capped by --limit / maxNewCandidatesPerRun the terminal
 * FINAL count can be smaller than passedSafety; the chain still holds
 * because each intermediate is derived from the prior, not from the end.
 */
export function computeFunnel(c: FunnelCounters): DiscoveryFunnel {
  const dedupeDrop = c.duplicates + c.ambiguous;
  const intentDrop = c.wrongNiche;
  const safetyDrop = c.lowConfidence + c.hardReject + c.riskRejected;

  const normalized = c.normalized;
  const unique = c.unique;
  const passedIntent = Math.max(0, unique - intentDrop);
  const passedSafety = Math.max(0, passedIntent - safetyDrop);
  const finalPending = c.finalPending;

  const stage = (
    name: string,
    key: string,
    inCount: number,
    outCount: number,
    dropped: number
  ): FunnelStage => ({ name, key, in: inCount, out: outCount, dropped });

  const stages: FunnelStage[] = [
    stage('RAW SEARCH', 'raw', c.raw, c.raw, 0),
    stage('NORMALIZATION', 'normalization', c.raw, normalized, Math.max(0, c.raw - normalized)),
    stage('DEDUPLICATION', 'deduplication', normalized, unique, dedupeDrop),
    stage('EARLY STUDY-INTENT FILTER', 'study-intent', unique, passedIntent, intentDrop),
    stage('SAFETY & QUALITY FILTER', 'safety', passedIntent, passedSafety, safetyDrop),
    stage('FINAL (new pending)', 'final', passedSafety, finalPending, Math.max(0, passedSafety - finalPending)),
  ];

  return {
    stages,
    finalPending,
    diagnostics: {
      invalidUrl: c.invalidUrl,
      unknownPlatform: c.unknownPlatform,
      duplicates: c.duplicates,
      ambiguous: c.ambiguous,
      wrongNiche: c.wrongNiche,
      lowConfidence: c.lowConfidence,
      hardReject: c.hardReject,
      riskRejected: c.riskRejected,
      riskFlagged: c.riskFlagged,
      providerRequests: c.providerRequests,
    },
  };
}

/**
 * Validate that a computed funnel is a genuine sequential chain:
 * every stage's OUT equals the next stage's IN, every dropped count equals
 * in - out, and no field is negative. Returns a list of violations (empty
 * when the funnel is sound).
 */
export function validateFunnel(funnel: DiscoveryFunnel): string[] {
  const issues: string[] = [];
  for (let i = 0; i < funnel.stages.length; i++) {
    const s = funnel.stages[i];
    if (s.in < 0 || s.out < 0 || s.dropped < 0) {
      issues.push(`${s.key}: negative value (in=${s.in}, out=${s.out}, dropped=${s.dropped})`);
    }
    if (s.dropped !== s.in - s.out) {
      issues.push(`${s.key}: dropped ${s.dropped} != in(${s.in}) - out(${s.out}) = ${s.in - s.out}`);
    }
    if (i > 0 && s.in !== funnel.stages[i - 1].out) {
      issues.push(`${s.key}: in(${s.in}) != prior stage out(${funnel.stages[i - 1].out}) — not a chain`);
    }
  }
  if (funnel.finalPending !== funnel.stages[funnel.stages.length - 1].out) {
    issues.push(`finalPending(${funnel.finalPending}) != last stage out(${funnel.stages[funnel.stages.length - 1].out})`);
  }
  return issues;
}

/** Render the funnel as a compact text block for the discover summary log. */
export function formatFunnel(funnel: DiscoveryFunnel): string {
  const head = 'DISCOVERY FUNNEL (sequential — each OUT = prior IN − dropped):';
  const lines = funnel.stages.map((s, i) => {
    const arrow = i === 0 ? '▶' : '└▶';
    return `${arrow} ${s.name.padEnd(28)} ${s.in} → ${s.out}${s.dropped > 0 ? `  (−${s.dropped})` : ''}`;
  });
  const d = funnel.diagnostics;
  const diag = [
    `provider-requests=${d.providerRequests}`,
    `invalid-url=${d.invalidUrl}`,
    `unknown-platform=${d.unknownPlatform}`,
    `duplicates=${d.duplicates}`,
    `ambiguous=${d.ambiguous}`,
    `wrong-niche=${d.wrongNiche}`,
    `low-confidence=${d.lowConfidence}`,
    `hard-reject=${d.hardReject}`,
    `exam-risk-rejected=${d.riskRejected}`,
    `exam-risk-flagged=${d.riskFlagged}`,
  ].join(', ');
  return `${head}\n${lines.join('\n')}\nFINAL: ${funnel.finalPending} new active pending\nDIAGNOSTIC METRICS: ${diag}`;
}
