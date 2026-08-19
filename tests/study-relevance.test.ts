import { describe, it, expect } from 'vitest';
import {
  enforceCategoryConsistency,
  STRONG_SIGNAL_THRESHOLD,
} from '../scripts/classify/categoryConsistency';
import { getExam } from '../src/config/exams';
import { getExamFamily } from '../src/config/examFamilies';
import { communitySchema } from '../src/lib/schema';
import { makeCommunity } from './helpers';

describe('study relevance (niche fit for the study-prep vertical)', () => {
  it('treats a general cybersecurity professionals group as wrong-niche (no exam-study signal)', () => {
    const result = enforceCategoryConsistency({
      title: 'General cybersecurity professionals Discord',
      description: 'Networking and career discussions for infosec professionals.',
      tags: ['career', 'networking'],
      category: 'cybersecurity-certifications',
    });
    // A general professional community must not be reclassified as an
    // exam-study community: the category stays untouched and no override
    // reason is produced.
    expect(result.changed).toBe(false);
    expect(result.category).toBe('cybersecurity-certifications');
    expect(result.reason).toBeUndefined();
  });

  it('maps a CompTIA Security+ SY0-701 study community to cybersecurity-certifications', () => {
    const result = enforceCategoryConsistency({
      title: 'Discord community studying CompTIA Security+ SY0-701',
      description:
        'Daily study group with practice questions and exam strategy for the CompTIA Security+ certification.',
      tags: ['security+', 'practice questions'],
      category: null,
    });
    expect(result.category).toBe('cybersecurity-certifications');
    expect(result.changed).toBe(true);
    expect(result.reason).toBeTruthy();
  });

  it('resolves the Security+ family and exam slugs for a study-prep record', () => {
    const record = makeCommunity({
      title: 'Discord community studying CompTIA Security+ SY0-701',
      category: 'cybersecurity-certifications',
      examFamilies: ['cybersecurity-certifications'],
      exams: ['security-plus'],
      certificationProvider: 'CompTIA',
      examLevel: 'SY0-701',
      studyTypes: ['study-group', 'practice-questions'],
      targetMarkets: ['global-english'],
    });
    expect(communitySchema.safeParse(record).success).toBe(true);
    expect(record.vertical).toBe('study-prep');
    expect(record.category).toBe('cybersecurity-certifications');
    expect(getExamFamily('cybersecurity-certifications')?.name).toBe('Cybersecurity Certifications');
    const securityPlus = getExam('security-plus');
    expect(securityPlus?.name).toBe('CompTIA Security+');
    expect(securityPlus?.family).toBe('cybersecurity-certifications');
    expect(STRONG_SIGNAL_THRESHOLD).toBeGreaterThanOrEqual(2);
  });
});