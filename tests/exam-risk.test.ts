import { describe, it, expect } from 'vitest';
import { classifyExamRisk } from '../scripts/safety/examRiskClassifier';

/**
 * Exam-safety classification tests.
 *
 * Target module (scripts/safety/examRiskClassifier.ts) is being written in
 * parallel — these tests are written against the agreed API
 * `classifyExamRisk(text: string) -> { level, flags }` and will be
 * validated at integration time.
 */
describe('classifyExamRisk', () => {
  it('flags leaked real exam questions as high-risk reject', () => {
    const result = classifyExamRisk("Real AWS exam questions leaked from yesterday's test");
    expect(result.level).toBe('high-risk-reject');
    expect(result.flags).toBeTruthy();
  });

  it('passes legitimate mock-question study discussions', () => {
    const result = classifyExamRisk('Join us for AWS mock questions and exam study discussions');
    expect(result.level).toBe('clean');
  });

  it('flags paid exam impersonation as high-risk reject', () => {
    const result = classifyExamRisk('Pay us and someone will take your certification exam');
    expect(result.level).toBe('high-risk-reject');
  });

  it('passes practice questions and flashcards for the NCLEX', () => {
    const result = classifyExamRisk('Practice questions and flashcards for the NCLEX');
    expect(result.level).toBe('clean');
  });
});