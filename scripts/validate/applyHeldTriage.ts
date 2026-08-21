import fs from 'fs';
import path from 'path';
import type { Community } from '../../src/types/community';

interface RejectedEntry {
  id: string;
  candidateUrl: string;
  sourceUrl?: string;
  rejectedAt: string;
  reason: string;
  platform?: string;
  details?: Record<string, unknown>;
}

const groupsPath = path.resolve(process.cwd(), 'src/data/groups.json');
const heldPath = path.resolve(process.cwd(), 'src/data/held-groups.json');
const rejectedPath = path.resolve(process.cwd(), 'src/data/rejected-candidates.json');

const groups: Community[] = JSON.parse(fs.readFileSync(groupsPath, 'utf8'));
const held: Community[] = JSON.parse(fs.readFileSync(heldPath, 'utf8'));
const rejected: RejectedEntry[] = JSON.parse(fs.readFileSync(rejectedPath, 'utf8'));

console.log(`Current counts: Published=${groups.length}, Held=${held.length}, Rejected=${rejected.length}`);
