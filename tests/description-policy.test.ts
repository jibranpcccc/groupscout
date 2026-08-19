import { describe, it, expect } from 'vitest';
import {
  evaluateDescription,
  descriptionSafetyFlags,
  PROMOTIONAL_DESCRIPTION_FLAG,
} from '../scripts/safety/descriptionPolicy';

/**
 * Description-policy tests.
 *
 * Contract:
 *  - Promotional/filler copy ("join now", "grow your skills", "don't miss
 *    out", "boost your", marketing exclamations) is flagged with
 *    safetyFlags ['promotional-description'].
 *  - Factual / platform-extracted descriptions stay clean.
 */
describe('evaluateDescription — flags promotional/filler copy', () => {
  const PROMOTIONAL: Array<[string, string]> = [
    ['join now', 'Join now to start preparing!'],
    ['join our community now', 'Join our community now and ace the exam!'],
    ['join today', 'Join us today for daily quizzes'],
    ["don't miss out", "Don't miss out on the best study group"],
    ['do not miss out', 'Do not miss out on answers'],
    ['grow your skills', 'Grow your skills with our experts'],
    ['boost your', 'Boost your score with our premium tips'],
    ['supercharge your', 'Supercharge your prep with us'],
    ['unlock your potential', 'Unlock your potential in weeks'],
    ['hurry / limited time', 'Hurry! Limited time offer on full access'],
    ['sign up now', 'Sign up now for exclusive access'],
    ['marketing exclamation (multiple !)', 'Join us now!! Perfect scores guaranteed!'],
    ['hype emoji', '🚀 Daily questions and rocket-fast answers'],
    ['subscribe today', 'Subscribe today to never miss an update'],
  ];

  for (const [label, text] of PROMOTIONAL) {
    it(`flags "${label}"`, () => {
      const result = evaluateDescription(text);
      expect(result.promotional, `expected promotional for: ${text}`).toBe(true);
      expect(result.flags).toContain(PROMOTIONAL_DESCRIPTION_FLAG);
      expect(result.matches.length).toBeGreaterThan(0);
      expect(descriptionSafetyFlags(text)).toContain(PROMOTIONAL_DESCRIPTION_FLAG);
    });
  }
});

describe('evaluateDescription — keeps factual / platform-extracted descriptions clean', () => {
  const CLEAN: Array<[string, string | null | undefined]> = [
    ['platform-extracted factual', 'Daily MCQs for the AWS cloud practitioner exam'],
    ['study group purpose', 'A community for CFA Level 1 candidates to share notes and discuss'],
    ['schedule + format', 'Weekly mock SAT tests on Sundays with peer review'],
    ['subject + audience', 'Peer support group for nursing students taking the NCLEX'],
    ['mentions exam, no hype', 'Practice problems and flashcards for the USMLE Step 1'],
    ['specific + useful', 'Anki deck swaps and accountability check-ins for the MCAT'],
    ['resource listing', 'Free links to official IELTS sample papers and band-score guides'],
    ['descriptive but calm', 'Group for graduate students revising for their final exams'],
    ['empty description', null],
    ['undefined description', undefined],
  ];

  for (const [label, text] of CLEAN) {
    it(`leaves "${label}" clean`, () => {
      const result = evaluateDescription(text);
      expect(result.promotional, `expected clean for: ${JSON.stringify(text)}`).toBe(false);
      expect(result.flags).toEqual([]);
      expect(result.matches).toEqual([]);
      expect(descriptionSafetyFlags(text)).toEqual([]);
    });
  }
});

describe('evaluateDescription — edge cases', () => {
  it('does not flag a single innocent "join" in a factual sentence', () => {
    // "join" as a plain verb in context, not a CTA.
    const result = evaluateDescription('New users can join the server through the invite link');
    expect(result.promotional).toBe(false);
  });

  it('does not flag "boost" when used informationally', () => {
    // Boost appears once, but the sentence is factual — should stay clean.
    const result = evaluateDescription('We cover strategies to boost test-taking speed');
    expect(result.promotional).toBe(false);
  });
});
