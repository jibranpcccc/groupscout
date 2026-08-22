import fs from 'fs';
import path from 'path';

interface ExamHubContent {
  slug: string;
  name: string;
  intro: string;
  whatToLookFor: string[];
  platformGuidance: string;
  howWeCheck: string;
  faqs: Array<{ q: string; a: string }>;
}

const indexableSlugs = [
  'sat', 'gre', 'gmat', 'jee', 'neet', 'gate', 'upsc',
  'ielts', 'toefl', 'usmle', 'nclex', 'lsat', 'cfa', 'cpa', 'cissp'
];

function extractNarrative(slug: string): ExamHubContent {
  const filePath = path.resolve('dist', 'exam', slug, 'index.html');
  const html = fs.readFileSync(filePath, 'utf8');

  // Extract H1 & Intro
  const introMatch = html.match(/<h1[^>]*>[\s\S]*?<\/h1>\s*<p[^>]*>([\s\S]*?)<\/p>/i);
  const intro = introMatch ? introMatch[1].replace(/<[^>]+>/g, '').trim() : '';

  // Extract What to look for
  const whatMatch = html.match(/<h2[^>]*>What to Look for in an? [^<]*<\/h2>\s*<ul[^>]*>([\s\S]*?)<\/ul>/i);
  const whatItems: string[] = [];
  if (whatMatch) {
    const liMatches = whatMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    liMatches.forEach((li) => {
      whatItems.push(li.replace(/<[^>]+>/g, '').trim());
    });
  }

  // Extract Platform Guidance
  const platMatch = html.match(/<h2[^>]*>(?:Telegram vs Discord|Using Telegram|Using Discord)[^<]*<\/h2>([\s\S]*?)<\/div>\s*<\/div>/i);
  const platformGuidance = platMatch ? platMatch[1].replace(/<[^>]+>/g, '').trim() : '';

  // Extract How we check
  const checkMatch = html.match(/<h2[^>]*>How We Check [^<]*<\/h2>\s*<p[^>]*>([\s\S]*?)<\/p>/i);
  const howWeCheck = checkMatch ? checkMatch[1].replace(/<[^>]+>/g, '').trim() : '';

  // Extract FAQs
  const faqs: Array<{ q: string; a: string }> = [];
  const faqBlocks = html.match(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi) || [];
  faqBlocks.forEach((fb) => {
    const dt = fb.match(/<dt[^>]*>([\s\S]*?)<\/dt>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
    const dd = fb.match(/<dd[^>]*>([\s\S]*?)<\/dd>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
    if (dt && dd) {
      faqs.push({ q: dt, a: dd });
    }
  });

  return {
    slug,
    name: slug.toUpperCase(),
    intro,
    whatToLookFor: whatItems,
    platformGuidance,
    howWeCheck,
    faqs,
  };
}

const hubs = indexableSlugs.map(extractNarrative);

function jaccardSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const set2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (set1.size === 0 && set2.size === 0) return 1.0;
  if (set1.size === 0 || set2.size === 0) return 0.0;
  let intersection = 0;
  for (const item of set1) {
    if (set2.has(item)) intersection++;
  }
  return intersection / (set1.size + set2.size - intersection);
}

interface ComparisonResult {
  examA: string;
  examB: string;
  slugA: string;
  slugB: string;
  exactDuplicateParagraphs: string[];
  highlySimilarParagraphs: string[];
  howWeCheckDuplicate: boolean;
  similarityScore: number;
  manualReviewRequired: boolean;
}

const comparisons: ComparisonResult[] = [];
let totalExactDuplicates = 0;
let totalHighSimilarityPairs = 0;
let totalHowWeCheckDuplicates = 0;

for (let i = 0; i < hubs.length; i++) {
  for (let j = i + 1; j < hubs.length; j++) {
    const a = hubs[i];
    const b = hubs[j];

    // Check exact duplicate paragraphs
    const exactDuplicates: string[] = [];
    const highlySimilar: string[] = [];
    let howWeCheckDuplicate = false;

    // Compare Intros
    if (a.intro === b.intro && a.intro.length > 0) {
      exactDuplicates.push('intro paragraph');
    } else if (jaccardSimilarity(a.intro, b.intro) > 0.85) {
      highlySimilar.push('intro paragraph');
    }

    // Compare What to look for
    a.whatToLookFor.forEach((itemA, idxA) => {
      b.whatToLookFor.forEach((itemB, idxB) => {
        if (itemA === itemB && itemA.length > 20) {
          exactDuplicates.push(`What to look for [${idxA}]`);
        } else if (jaccardSimilarity(itemA, itemB) > 0.85 && itemA !== itemB) {
          highlySimilar.push(`What to look for [${idxA} vs ${idxB}]`);
        }
      });
    });

    // Compare Platform Guidance
    if (a.platformGuidance === b.platformGuidance && a.platformGuidance.length > 30) {
      exactDuplicates.push('platform guidance');
    } else if (jaccardSimilarity(a.platformGuidance, b.platformGuidance) > 0.85) {
      highlySimilar.push('platform guidance');
    }

    // Compare How We Check (Intentionally shared verification & anti-dump disclosure)
    if (a.howWeCheck.length > 0 && b.howWeCheck.length > 0) {
      // Normalize by removing the exam name
      const normA = a.howWeCheck.replace(new RegExp(a.name, 'gi'), '').replace(new RegExp(a.slug, 'gi'), '').trim();
      const normB = b.howWeCheck.replace(new RegExp(b.name, 'gi'), '').replace(new RegExp(b.slug, 'gi'), '').trim();
      if (a.howWeCheck === b.howWeCheck || normA === normB) {
        howWeCheckDuplicate = true;
        totalHowWeCheckDuplicates++;
      } else if (jaccardSimilarity(a.howWeCheck, b.howWeCheck) > 0.85) {
        howWeCheckDuplicate = true;
        totalHowWeCheckDuplicates++;
      }
    }

    // Compare FAQs
    a.faqs.forEach((faqA) => {
      b.faqs.forEach((faqB) => {
        if (faqA.a === faqB.a && faqA.a.length > 30) {
          exactDuplicates.push(`FAQ answer for "${faqA.q}"`);
        } else if (jaccardSimilarity(faqA.a, faqB.a) > 0.85 && faqA.a !== faqB.a) {
          highlySimilar.push(`FAQ answer for "${faqA.q}"`);
        }
      });
    });

    // Overall narrative similarity including howWeCheck
    const textA = `${a.intro} ${a.whatToLookFor.join(' ')} ${a.platformGuidance} ${a.howWeCheck} ${a.faqs.map(f => f.a).join(' ')}`;
    const textB = `${b.intro} ${b.whatToLookFor.join(' ')} ${b.platformGuidance} ${b.howWeCheck} ${b.faqs.map(f => f.a).join(' ')}`;
    const similarity = Math.round(jaccardSimilarity(textA, textB) * 100) / 100;

    if (exactDuplicates.length > 0) totalExactDuplicates += exactDuplicates.length;

    // Single unified condition for review
    const requiresReview = exactDuplicates.length > 0 || similarity > 0.75 || highlySimilar.length > 2;
    if (requiresReview) totalHighSimilarityPairs++;

    comparisons.push({
      examA: a.name,
      examB: b.name,
      slugA: a.slug,
      slugB: b.slug,
      exactDuplicateParagraphs: exactDuplicates,
      highlySimilarParagraphs: highlySimilar,
      howWeCheckDuplicate,
      similarityScore: similarity,
      manualReviewRequired: requiresReview,
    });
  }
}

const report = {
  timestamp: new Date().toISOString(),
  totalIndexableExamHubs: hubs.length,
  totalPairsCompared: comparisons.length,
  exactDuplicateSubstantiveParagraphs: totalExactDuplicates,
  howWeCheckSharedDisclaimerPairs: totalHowWeCheckDuplicates,
  highSimilarityPairsRequiringReview: totalHighSimilarityPairs,
  comparisons,
};

fs.mkdirSync('audit', { recursive: true });
fs.writeFileSync('audit/exam-hub-content-similarity.json', JSON.stringify(report, null, 2));

console.log('Exam Hub Similarity Audit completed.');
console.log(`Total Pairs Compared: ${comparisons.length}`);
console.log(`Exact Duplicate Substantive Paragraphs: ${totalExactDuplicates}`);
console.log(`How-We-Check Shared Disclaimer Pairs: ${totalHowWeCheckDuplicates}`);
console.log(`High Similarity Pairs Requiring Review: ${totalHighSimilarityPairs}`);

console.log(`High Similarity Pairs Requiring Review: ${totalHighSimilarityPairs}`);
