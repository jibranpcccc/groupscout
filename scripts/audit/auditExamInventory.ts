import fs from 'fs';
import { exams } from '../../src/config/exams';
import { getPublishedCommunities, isCommunityIndexWorthy } from '../../src/lib/communities';
import { EXAM_INDEX_MIN } from '../../src/config/discovery';

const published = getPublishedCommunities();
const examCounts = new Map<string, any>();

for (const exam of exams) {
  const matching = published.filter((c) => (c.exams ?? []).includes(exam.slug));
  if (matching.length >= EXAM_INDEX_MIN) {
    const telegram = matching.filter((c) => c.platform === 'telegram').length;
    const discord = matching.filter((c) => c.platform === 'discord').length;
    const whatsapp = matching.filter((c) => c.platform === 'whatsapp').length;
    const indexableDetails = matching.filter((c) => isCommunityIndexWorthy(c)).length;
    const sourceConfirmed = matching.filter((c) => c.verificationStatus === 'source-confirmed').length;
    const unverified = matching.filter((c) => c.verificationStatus === 'unverified').length;

    examCounts.set(exam.slug, {
      exam: exam.name,
      slug: exam.slug,
      total: matching.length,
      telegram,
      discord,
      whatsapp,
      indexableDetails,
      sourceConfirmed,
      unverified,
    });
  }
}

console.log(JSON.stringify(Array.from(examCounts.values()), null, 2));
