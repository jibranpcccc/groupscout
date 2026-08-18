/**
 * Shared script utilities: structured logging, sleep, moderation keywords.
 */

export function log(tag: string, message: string): void {
  console.log(`[${tag}] ${message}`);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Obvious-harm keyword lists for moderation. Matching never auto-publishes
 * or auto-declares a scam — it routes candidates to rejection or flags them
 * for manual review (see discover/index.ts).
 */
export const HARD_REJECT_PATTERNS: RegExp[] = [
  /\b(cp|child[ _-]?porn)\b/i,
  /\b(heroin|fentanyl|methamphetamine|buy[ -]?cocaine|silk road)\b/i,
  /\b(credit card dumps|stolen cards|cvv2|fullz)\b/i,
  /\b(exploit kit|ransomware[ -]?as[ -]?a[ -]?service|malware[ -]?shop)\b/i,
  /\b(terrorist|isis recruitment|jihadist)\b/i,
  /\b(phishing[ -]?kit|fake[ -]?login page|credential[ -]?stealer)\b/i,
];

export const RISK_LANGUAGE_PATTERNS: RegExp[] = [
  /guaranteed profits?/i,
  /100% win rate/i,
  /risk[- ]?free returns?/i,
  /double your money/i,
  /no loss ever/i,
  /sure win/i,
  /instant profits?/i,
];

export function hasHardRejectContent(text: string): boolean {
  return HARD_REJECT_PATTERNS.some((p) => p.test(text));
}

export function findRiskLanguage(text: string): string[] {
  const flags: string[] = [];
  for (const p of RISK_LANGUAGE_PATTERNS) {
    if (p.test(text)) flags.push('potential-risk-language');
  }
  return [...new Set(flags)];
}
