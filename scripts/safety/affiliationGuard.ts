/**
 * Official-affiliation guard for the study-prep discovery pipeline.
 *
 * Community listings sometimes present themselves as "Official <Provider>"
 * (e.g. "Official SAT prep", "Official IELTS group", "Official AWS training"),
 * implying endorsement or license from the exam body. Only a verifiable link
 * to the provider's own authoritative site corroborates such a claim. Without
 * it, the title/description is an unverified affiliation claim and must:
 *   1. get a safetyFlag (unauthorized-affiliation-claim), and
 *   2. never be treated as owner-confirmed by automated logic.
 *
 * Important: provider NAME SIMILARITY alone must NOT trigger. A community
 * called "SAT Study With Me" or a description that just mentions "AWS" is a
 * study community about that exam — it is not claiming to BE the provider's
 * official channel. Only an explicit "Official <Provider>" (or
 * "<Provider> Official") claim is flagged.
 *
 * Corroboration: the claim counts as backed when at least one source URL's
 * host is a known authoritative domain for that provider (e.g.
 * collegeboard.org for SAT, ielts.org/britishcouncil.org for IELTS,
 * aws.amazon.com for AWS, cfainstitute.org for CFA, comptia.org for CompTIA,
 * cisco.com for Cisco).
 *
 * Pure and deterministic: no I/O, no randomness.
 */

/** Authoritative domains (host, no scheme or www) that back an affiliation claim per provider. */
export const OFFICIAL_DOMAINS: Record<string, string[]> = {
  SAT: ['collegeboard.org', 'sat.collegeboard.org'],
  PSAT: ['collegeboard.org'],
  IELTS: ['ielts.org', 'britishcouncil.org', 'idp.com'],
  TOEFL: ['ets.org', 'toefl.org'],
  GRE: ['ets.org'],
  AWS: ['aws.amazon.com', 'amazon.com'],
  'Azure': ['azure.microsoft.com', 'microsoft.com'],
  GCP: ['cloud.google.com', 'google.com'],
  CFA: ['cfainstitute.org'],
  'CompTIA': ['comptia.org'],
  Cisco: ['cisco.com'],
  PMP: ['pmi.org'],
  CPA: ['aicpa.org', 'aicpa-cima.com'],
  NCLEX: ['ncsbn.org'],
  USMLE: ['usmle.org', 'nbme.org'],
  OSCP: ['offsec.com'],
  'CEH': ['eccouncil.org'],
};

/** The canonical official-affiliation safety flag name. */
export const AFFILIATION_CLAIM_FLAG = 'unauthorized-affiliation-claim';
/** The safety flag name used when an "official" claim is corroborated (informational only). */
export const AFFILIATION_CORROBORATED_FLAG = 'affiliation-corroborated';

export interface AffiliationAssessment {
  /** True when an explicit "Official <Provider>" claim was detected. */
  claimed: boolean;
  /** The provider named in the claim (e.g. "SAT"), when claimed. */
  provider?: string;
  /** True when an authoritative source URL backs the claim. */
  corroborated: boolean;
  /** Exact provider match that was corroborated, when found. */
  corroboratedProvider?: string;
  /** safetyFlags to ADD to the record (only the unauthorized claim when uncorroborated). */
  flags: string[];
  /**
   * When true, the record must NOT be treated as owner-confirmed. True when
   * an "official" claim is made but not corroborated by an authoritative URL.
   */
  blockOwnerConfirmed: boolean;
}

export interface AffiliationInput {
  title?: string;
  description?: string | null;
  sourceUrls?: string[];
}

const hostOf = (url: string): string => {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Detect an explicit "Official <Provider>" claim in the title/description.
 *
 * Returns the regex match (for provider extraction) or null. Name similarity
 * alone (a title like "SAT Study With Me") never matches because "official"
 * must immediately precede the claim.
 */
function detectOfficialClaim(text: string): { provider: string } | null {
  // Match "Official <Provider>" where Provider is an uppercase acronym or a
  // capitalised brand word. Requiring a capitalised/acronym token plus an
  // explicit "official" keeps name-similarity from triggering.
  const match = /\bofficial\s+([A-Z][A-Za-z0-9&.+-]*(?:\s+[A-Z][A-Za-z0-9&.+-]*)?)\b/i.exec(text);
  if (!match) return null;
  return { provider: match[1].trim() };
}

function normalizeProvider(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').replace(/&/g, 'and').trim();
}

/** Look up the canonical provider key by normalized name (case-insensitive, tolerant of "AWS Cloud" → "AWS"). */
function resolveProvider(provider: string): string | undefined {
  const norm = normalizeProvider(provider);
  for (const key of Object.keys(OFFICIAL_DOMAINS)) {
    const keyNorm = normalizeProvider(key);
    if (norm === keyNorm) return key;
    // e.g. "AWS Cloud" or "AWS Certification" → AWS; "CompTIA Security+" → CompTIA
    if (norm.startsWith(keyNorm) || keyNorm.startsWith(norm)) return key;
  }
  return undefined;
}

/**
 * Assess whether a record's title/description makes an unsupported "Official
 * <Provider>" claim. Returns flags to add and whether owner-confirmed must be
 * blocked. Deterministic and pure.
 */
export function assessAffiliationClaim(input: AffiliationInput): AffiliationAssessment {
  const text = [input.title ?? '', input.description ?? ''].join(' \n ');
  const claim = detectOfficialClaim(text);

  if (!claim) {
    return { claimed: false, corroborated: false, flags: [], blockOwnerConfirmed: false };
  }

  const provider = resolveProvider(claim.provider);
  if (!provider) {
    // "Official <word>" that is not a known exam-provider is ordinary English
    // ("Official Study Group", "Official Weekly Meetup") — name-similarity must
    // never trigger, so unrecognised bodies are left alone.
    return { claimed: false, corroborated: false, flags: [], blockOwnerConfirmed: false };
  }

  const urls = input.sourceUrls ?? [];
  const corrobo = OFFICIAL_DOMAINS[provider].some((d) =>
    urls.some((u) => hostOf(u) === d || hostOf(u).endsWith('.' + d))
  );

  if (corrobo) {
    return {
      claimed: true,
      provider,
      corroborated: true,
      corroboratedProvider: provider,
      flags: [AFFILIATION_CORROBORATED_FLAG],
      blockOwnerConfirmed: false,
    };
  }

  return {
    claimed: true,
    provider,
    corroborated: false,
    flags: [AFFILIATION_CLAIM_FLAG],
    blockOwnerConfirmed: true,
  };
}

/**
 * Convenience integration for a record draft: merges the affiliation
 * safetyFlag into the record's safetyFlags and returns an updated
 * verificationStatus that is never owner-confirmed when a claim is
 * uncorroborated. If the record was already owner-confirmed and the claim is
 * unsupported, it is downgraded to 'source-confirmed' (as high as the
 * evidence supports) so no automated/owner-confirmed treatment happens.
 */
export interface AffiliationGuardOutcome<T> {
  record: T;
  assessment: AffiliationAssessment;
  downgradedFromOwnerConfirmed: boolean;
}

export function guardAffiliation<T extends { safetyFlags?: string[]; verificationStatus?: string }>(
  record: T,
  input: AffiliationInput
): AffiliationGuardOutcome<T> {
  const assessment = assessAffiliationClaim(input);

  if (!assessment.claimed) {
    return { record, assessment, downgradedFromOwnerConfirmed: false };
  }

  const safetyFlags = [...new Set([...(record.safetyFlags ?? []), ...assessment.flags])];
  let verificationStatus = record.verificationStatus;
  let downgraded = false;

  if (assessment.blockOwnerConfirmed && verificationStatus === 'owner-confirmed') {
    verificationStatus = 'source-confirmed';
    downgraded = true;
  }

  return {
    record: { ...record, safetyFlags, verificationStatus } as T,
    assessment,
    downgradedFromOwnerConfirmed: downgraded,
  };
}
