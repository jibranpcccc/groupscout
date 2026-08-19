import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { holdNonActive, classifyMove, type HeldGroup } from '../scripts/data/holdNonActive';
import { makeCommunity } from './helpers';
import type { Community } from '../src/types/community';

let dir: string;
let pendingPath: string;
let heldPath: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'hold-non-active-'));
  pendingPath = join(dir, 'pending-groups.json');
  heldPath = join(dir, 'held-groups.json');
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function writePending(records: Community[]): void {
  writeFileSync(pendingPath, JSON.stringify(records, null, 2));
}
function writeHeld(records: HeldGroup[]): void {
  writeFileSync(heldPath, JSON.stringify(records, null, 2));
}
function readPending(): Community[] {
  return JSON.parse(readFileSync(pendingPath, 'utf-8')) as Community[];
}
function readHeld(): HeldGroup[] {
  return JSON.parse(readFileSync(heldPath, 'utf-8')) as HeldGroup[];
}

describe('classifyMove', () => {
  it('returns null for an active, exam-focused record', () => {
    const rec = makeCommunity({ linkStatus: 'active', category: 'college-admissions', exams: ['sat'], examFamilies: ['college-admissions'] });
    expect(classifyMove(rec)).toBeNull();
  });

  it('flags non-active link statuses', () => {
    for (const status of ['unknown', 'dead', 'removed', 'reported'] as const) {
      const rec = makeCommunity({ linkStatus: status });
      const reason = classifyMove(rec);
      expect(reason).not.toBeNull();
      expect(reason).toContain(`linkStatus=${status}`);
    }
  });

  it('flags generic-study category even with active link', () => {
    const rec = makeCommunity({ linkStatus: 'active', category: 'general-study' });
    const reason = classifyMove(rec);
    expect(reason).not.toBeNull();
    expect(reason).toContain('generic study/accountability');
  });

  it('flags exam-less record whose title matches the generic regex', () => {
    const rec = makeCommunity({ linkStatus: 'active', category: 'technology-certifications', exams: [], examFamilies: [], title: 'Study Together — daily accountability' });
    const reason = classifyMove(rec);
    expect(reason).not.toBeNull();
    expect(reason).toContain('generic study/accountability');
  });

  it('keeps an active record without exams but an unrelated title', () => {
    const rec = makeCommunity({ linkStatus: 'active', category: 'law', exams: [], examFamilies: [], title: 'Bar Exam Prep Discussion' });
    expect(classifyMove(rec)).toBeNull();
  });
});

describe('holdNonActive', () => {
  it('keeps active, exam-relevant records in pending', () => {
    writePending([
      makeCommunity({ id: 'keep-1', linkStatus: 'active', category: 'college-admissions', exams: ['sat'], examFamilies: ['college-admissions'] }),
      makeCommunity({ id: 'keep-2', linkStatus: 'active', category: 'law', exams: ['bar'], examFamilies: ['law'] }),
    ]);

    const result = holdNonActive({ pendingPath, heldPath });

    expect(result.checked).toBe(2);
    expect(result.kept).toBe(2);
    expect(result.moved).toBe(0);
    expect(readPending()).toHaveLength(2);
    expect(readHeld()).toHaveLength(0);
  });

  it('moves unknown/dead/removed/reported records to held', () => {
    const statuses = ['unknown', 'dead', 'removed', 'reported'] as const;
    writePending(statuses.map((s, i) => makeCommunity({ id: `move-${i}`, linkStatus: s, category: 'college-admissions', exams: ['sat'] })));

    const result = holdNonActive({ pendingPath, heldPath });

    expect(result.moved).toBe(4);
    expect(result.kept).toBe(0);
    const held = readHeld();
    expect(held).toHaveLength(4);
    for (let i = 0; i < statuses.length; i++) {
      expect(held[i].heldReason).toContain(`linkStatus=${statuses[i]}`);
      // Full record is preserved.
      expect(held[i].id).toBe(`move-${i}`);
      expect(held[i].title).toBeDefined();
    }
    expect(readPending()).toHaveLength(0);
  });

  it('moves generic study/accountability records (no exam/cert focus) to held', () => {
    writePending([
      // category === 'general-study'
      makeCommunity({ id: 'gen-1', linkStatus: 'active', category: 'general-study', exams: [], examFamilies: [] }),
      // exam-less + title match
      makeCommunity({ id: 'gen-2', linkStatus: 'active', category: 'technology-certifications', exams: [], examFamilies: [], title: 'Study With Me accountability' }),
    ]);

    const result = holdNonActive({ pendingPath, heldPath });

    expect(result.moved).toBe(2);
    expect(result.kept).toBe(0);
    const held = readHeld();
    expect(held).toHaveLength(2);
    for (const h of held) {
      expect(h.heldReason).toContain('generic study/accountability');
      expect(h.heldReason).toContain('exam/cert focus');
    }
  });

  it('appends to held-groups.json instead of overwriting existing records', () => {
    // Pre-existing held record (must survive).
    const existingHeld: HeldGroup = {
      ...makeCommunity({ id: 'preexisting-held', linkStatus: 'unknown' }),
      heldReason: 'prior manual cleanup',
    };
    writeHeld([existingHeld]);

    // One active record to keep, one dead record to move.
    writePending([
      makeCommunity({ id: 'keep-1', linkStatus: 'active', category: 'law', exams: ['bar'] }),
      makeCommunity({ id: 'move-1', linkStatus: 'dead', category: 'college-admissions', exams: ['sat'] }),
    ]);

    const result = holdNonActive({ pendingPath, heldPath });

    expect(result.heldBefore).toBe(1);
    expect(result.heldAfter).toBe(2); // preexisting + 1 moved
    expect(result.moved).toBe(1);
    expect(result.kept).toBe(1);

    const held = readHeld();
    expect(held).toHaveLength(2);
    // The pre-existing record is preserved verbatim (appended, not overwritten).
    const survivor = held.find((h) => h.id === 'preexisting-held');
    expect(survivor).toBeDefined();
    expect(survivor?.heldReason).toBe('prior manual cleanup');
    // And the newly moved record is present with its linkStatus reason.
    const moved = held.find((h) => h.id === 'move-1');
    expect(moved?.heldReason).toContain('linkStatus=dead');
    // Pending still has the kept active record.
    const pending = readPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe('keep-1');
  });

  it('tolerates a missing pending file (treats it as empty)', () => {
    if (existsSync(pendingPath)) rmSync(pendingPath);
    const result = holdNonActive({ pendingPath, heldPath });
    expect(result.checked).toBe(0);
    expect(result.moved).toBe(0);
    // held file remains a valid empty array.
    expect(readHeld()).toEqual([]);
  });
});
