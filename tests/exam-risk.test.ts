import { describe, it, expect } from 'vitest';
import {
  classifyExamRisk,
  isRiskFlagged,
  isHighRiskReject,
} from '../scripts/safety/examRiskClassifier';

/**
 * Exam-safety classification tests — a full matrix.
 *
 * Target module: scripts/safety/examRiskClassifier.ts
 * API: classifyExamRisk(text) -> { level: 'clean'|'risk-flagged'|'high-risk-reject', flags }
 *
 * Contract:
 *  - high-risk-reject: real exam dumps, braindumps, leaked exams, actual exam
 *    questions, stolen questions, proxy test takers, buying certificates,
 *    credential fraud. Never routed to pending.
 *  - risk-flagged: ambiguous language warranting human review (guaranteed
 *    questions, answer keys, paper leaks, exam-dump talk) -> pending w/ flag.
 *  - clean: legitimate study support (practice questions, mock exams,
 *    flashcards, official sample tests, peer quizzes, study notes).
 */
describe('classifyExamRisk', () => {
  describe('REJECT: high-risk exam-integrity violations', () => {
    const REJECT_CASES: Array<[string, string]> = [
      ['real exam dumps', 'Latest AWS real exam dumps download'],
      ['actual exam dumps', 'Get actual exam dumps for the CCNA'],
      ['braindumps', 'Updated braindumps for the PMP exam'],
      ['brain dumps (spaced)', 'Brain dumps direct from last session'],
      ['leaked exam', 'The full leaked exam is now available'],
      ['leaked exam questions', 'Real AWS exam questions leaked from yesterday'],
      ['actual exam questions', 'Actual exam questions from the last sitting'],
      ['real exam questions', 'Real exam questions posted before exam day'],
      ['stolen questions', 'We have stolen questions from the exam center'],
      ['stolen exam materials', 'Stolen test materials are posted here'],
      ['proxy test taker', 'Hire a proxy test taker to pass for you'],
      ['take exam for you (bare)', 'We will take exam for you, guaranteed pass'],
      ['take the exam for you', 'Pay us and someone will take the exam for you'],
      ['take your exam for you', 'Experts take your exam for you while you relax'],
      ['certificate without exam', 'Get your certificate without exam'],
      ['pay for certificate', 'Pay for certificate and receive it today'],
      ['credential fraud', 'This is pure credential fraud'],
      ['fake certificates', 'Fake certificates for sale'],
      ['buy verified certificate', 'Buy verified certificates cheap'],
      ['exam impersonation', 'Our exam impersonation service is confidential'],
    ];

    for (const [label, text] of REJECT_CASES) {
      it(`rejects "${label}"`, () => {
        const result = classifyExamRisk(text);
        expect(result.level, `expected high-risk-reject for: ${text}`).toBe('high-risk-reject');
        expect(result.flags.length).toBeGreaterThan(0);
        expect(isHighRiskReject(result)).toBe(true);
        expect(isRiskFlagged(result)).toBe(false);
      });
    }
  });

  describe('FLAG: ambiguous language that warrants human review (not rejection)', () => {
    const FLAG_CASES: Array<[string, string]> = [
      ['guaranteed questions', 'We post guaranteed questions that appear on the exam'],
      ['exam leaks', 'Daily exam leaks and updates'],
      ['leaked paper', 'Find leaked paper from last test'],
      ['answer key', 'Answer key for the recent quiz'],
      ['answer keys (plural)', 'All answer keys after each mock'],
      ['paper leak', 'Paper leak discussion thread'],
      ['question paper leak', 'Discussing the question paper leak before exam day'],
      ['exam dumps talk', 'Anyone discussing exam dumps?'],
    ];

    for (const [label, text] of FLAG_CASES) {
      it(`flags "${label}" as risk-flagged, not rejected`, () => {
        const result = classifyExamRisk(text);
        expect(result.level, `expected risk-flagged for: ${text}`).toBe('risk-flagged');
        expect(result.flags.length).toBeGreaterThan(0);
        expect(isRiskFlagged(result)).toBe(true);
        expect(isHighRiskReject(result)).toBe(false);
      });
    }
  });

  describe('CLEAN: legitimate study support must never be flagged', () => {
    const CLEAN_CASES: Array<[string, string]> = [
      ['practice questions', 'Join us for AWS mock questions and exam study discussions'],
      ['practice questions for NCLEX', 'Practice questions and flashcards for the NCLEX'],
      ['mock exams', 'Weekly mock exams with full answer explanations'],
      ['flashcards', 'Anki flashcards deck for step 2'],
      ['official sample tests', 'Official sample tests from the exam board'],
      ['peer-created quizzes', 'Peer-created quizzes to test yourself'],
      ['study notes', 'Shared study notes and summaries'],
      ['real study group', 'SAT Study With Me study group'],
      ['SAT prep group', 'A supportive SAT study-prep community'],
      ['exam strategy', 'Exam strategy and time management tips'],
      ['study with the word exam only', 'Join our exam prep community'],
      ['certificate study (not buying)', 'CISSP certificate study discussion'],
    ];

    for (const [label, text] of CLEAN_CASES) {
      it(`leaves "${label}" clean`, () => {
        const result = classifyExamRisk(text);
        expect(result.level, `expected clean for: ${text}`).toBe('clean');
        expect(result.flags).toEqual([]);
        expect(isRiskFlagged(result)).toBe(false);
        expect(isHighRiskReject(result)).toBe(false);
      });
    }
  });

  it('high-risk always wins over clean/flagged language in the same text', () => {
    const result = classifyExamRisk(
      'Great practice questions, but we also sell real exam dumps'
    );
    expect(result.level).toBe('high-risk-reject');
  });

  it('handles empty / non-string input gracefully', () => {
    expect(classifyExamRisk('')).toEqual({ level: 'clean', flags: [] });
    expect(classifyExamRisk(undefined as unknown as string)).toEqual({
      level: 'clean',
      flags: [],
    });
  });
});
