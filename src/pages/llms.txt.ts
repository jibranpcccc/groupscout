import type { APIRoute } from 'astro';
import { siteConfig } from '../config/site';
import { getPublishedCommunities } from '../lib/communities';
import { exams } from '../config/exams';
import { examFamilies } from '../config/examFamilies';
import { platforms } from '../config/platforms';
import { EXAM_INDEX_MIN, PLATFORM_INDEX_MIN } from '../config/discovery';

/**
 * Dynamic llms.txt generated from the exact published dataset at build time
 * so community, exam, category, and platform counts never drift from the HTML.
 */
export const GET: APIRoute = () => {
  const published = getPublishedCommunities();
  const activeCount = published.filter((c) => c.linkStatus === 'active').length;

  const examCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const platformCounts = new Map<string, number>();

  for (const c of published) {
    categoryCounts.set(c.category, (categoryCounts.get(c.category) ?? 0) + 1);
    platformCounts.set(c.platform, (platformCounts.get(c.platform) ?? 0) + 1);
    for (const e of c.exams ?? []) {
      examCounts.set(e, (examCounts.get(e) ?? 0) + 1);
    }
  }

  const indexableExamLines = exams
    .filter((e) => (examCounts.get(e.slug) ?? 0) >= EXAM_INDEX_MIN)
    .sort((a, b) => (examCounts.get(b.slug) ?? 0) - (examCounts.get(a.slug) ?? 0))
    .map(
      (e) =>
        `- [${e.name} Study Groups](${siteConfig.url}/exam/${e.slug}/): ${examCounts.get(e.slug)} listed communities. ${e.description}`
    );

  const indexableCategoryLines = examFamilies
    .filter((f) => (categoryCounts.get(f.slug) ?? 0) >= 5)
    .sort((a, b) => (categoryCounts.get(b.slug) ?? 0) - (categoryCounts.get(a.slug) ?? 0))
    .map(
      (f) =>
        `- [${f.name}](${siteConfig.url}/category/${f.slug}/): ${categoryCounts.get(f.slug)} listed communities. ${f.description}`
    );

  const indexablePlatformLines = platforms
    .filter((p) => (platformCounts.get(p.id) ?? 0) >= PLATFORM_INDEX_MIN)
    .sort((a, b) => (platformCounts.get(b.id) ?? 0) - (platformCounts.get(a.id) ?? 0))
    .map(
      (p) =>
        `- [${p.name} Study Groups](${siteConfig.url}/platform/${p.id}/): ${platformCounts.get(p.id)} listed communities. ${p.description}`
    );

  const lines = [
    `# ${siteConfig.name}`,
    '',
    `> Independent, link-checked directory of ${published.length} public exam-preparation and certification study communities (${activeCount} confirmed active) across Telegram and Discord.`,
    '',
    '## Core Study Hubs',
    '',
    ...indexableExamLines,
    '',
    '## Categories',
    '',
    ...indexableCategoryLines,
    '',
    '## Platforms',
    '',
    ...indexablePlatformLines,
    '',
    '## Interactive Tools',
    '',
    `- [Study Partner & Group Pacing Calculator](${siteConfig.url}/#pacing-calculator): Free client-side calculator recommending weekly solo revision vs. peer discussion hours across ${indexableExamLines.length} major exams.`,
    `- [Full Directory Browser](${siteConfig.url}/communities/): Filter all ${published.length} published communities by exam, category, platform, and link status.`,
    '',
    '## Key Facts',
    '',
    `- **Website**: ${siteConfig.url}/`,
    `- **Listed Communities**: ${published.length} published (${activeCount} active link-checked)`,
    `- **Indexable Exam Hubs**: ${indexableExamLines.length} (minimum ${EXAM_INDEX_MIN} communities per hub)`,
    '- **Access Cost**: Free. All public communities listed on StudyGroupsHub are free to access via direct platform invite links.',
    '- **Link Integrity**: Automated validation checks public invite URLs on schedule and labels inactive or uncertain links transparently.',
    '- **Anti-Braindump Policy**: Explicitly prohibits and rejects braindumps, leaked test questions, recalled exam items, and proxy testing schemes.',
    '- **Independence**: Independent directory not affiliated with, sponsored by, or endorsed by Telegram, Discord, WhatsApp, or any exam provider.',
    '',
    '## Governance & Policies',
    '',
    `- [Academic Integrity Policy](${siteConfig.url}/academic-integrity/): Standards on prohibited materials, braindump exclusion, and student safety.`,
    `- [How We Verify](${siteConfig.url}/how-we-verify/): Link-checking methodology and verification state definitions.`,
    `- [Editorial Policy](${siteConfig.url}/editorial-policy/): Community inclusion criteria, review workflows, and listing maintenance.`,
    `- [Study Safety](${siteConfig.url}/safety/): Guidelines for student privacy and avoiding exam-prep scams.`,
    '',
    '## Discovery & Contact',
    '',
    `- **XML Sitemap**: ${siteConfig.url}/sitemap-index.xml`,
    `- **RSS Feed**: ${siteConfig.url}/rss.xml`,
    `- **Support & Corrections**: ${siteConfig.url}/contact/`,
    `- **Report Listing**: ${siteConfig.url}/report/`,
    `- **Submit New Community**: ${siteConfig.url}/submit/`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
