import { execSync } from 'child_process';
import fs from 'fs';

const targets = [
  { name: 'Homepage (Run 1)', url: 'https://studygroupshub.com/' },
  { name: 'Homepage (Run 2)', url: 'https://studygroupshub.com/' },
  { name: 'Homepage (Run 3)', url: 'https://studygroupshub.com/' },
  { name: 'Directory', url: 'https://studygroupshub.com/communities/' },
  { name: 'Exam Hub (IELTS)', url: 'https://studygroupshub.com/exam/ielts/' },
  { name: 'Exam Hub (USMLE)', url: 'https://studygroupshub.com/exam/usmle/' },
  { name: 'Category Hub (English)', url: 'https://studygroupshub.com/category/english-proficiency/' },
  { name: 'Platform Hub (Telegram)', url: 'https://studygroupshub.com/platform/telegram/' },
  { name: 'Detail Page', url: 'https://studygroupshub.com/group/telegram-makon-ap-exams-study-channel/' },
];

console.log('=== RUNNING LIGHTHOUSE MOBILE AUDIT ===\n');

export interface LighthouseMetricResult {
  name: string;
  url: string;
  performance?: number;
  accessibility?: number;
  bestPractices?: number;
  seo?: number;
  lcp?: string;
  lcpValue?: number;
  cls?: string;
  clsValue?: number;
  tbt?: string;
  tbtValue?: number;
  speedIndex?: string;
  failingAudits?: Array<{ id: string; title: string; score: number | null; explanation?: string }>;
  opportunities?: Array<{ id: string; title: string; displayValue?: string }>;
  error?: string;
}

const results: LighthouseMetricResult[] = [];

for (const t of targets) {
  const outFile = `audit/temp-lh-${Date.now()}.json`;
  try {
    console.log(`Auditing ${t.name}: ${t.url}...`);
    const cmd = `npx lighthouse "${t.url}" --output=json --output-path=${outFile} --chrome-flags="--headless=new --no-sandbox" --form-factor=mobile --screenEmulation.mobile=true --throttling-method=simulate --quiet`;
    try {
      execSync(cmd, { encoding: 'utf8', timeout: 90000 });
    } catch {
      // Chrome launcher on Windows can trigger EPERM on temp dir deletion even after writing output
    }

    if (fs.existsSync(outFile)) {
      const lhData = JSON.parse(fs.readFileSync(outFile, 'utf8'));
      const categories = lhData.categories;
      const audits = lhData.audits || {};

      const failingAudits: Array<{ id: string; title: string; score: number | null; explanation?: string }> = [];
      const opportunities: Array<{ id: string; title: string; displayValue?: string }> = [];

      Object.keys(audits).forEach((id) => {
        const a = audits[id];
        if (a.score !== null && a.score < 1 && (a.scoreDisplayMode === 'binary' || a.scoreDisplayMode === 'numeric')) {
          failingAudits.push({
            id,
            title: a.title,
            score: a.score,
            explanation: a.explanation || a.description,
          });
        }
        if (a.details?.type === 'opportunity' && (a.numericValue ?? 0) > 50) {
          opportunities.push({
            id,
            title: a.title,
            displayValue: a.displayValue,
          });
        }
      });

      const scores: LighthouseMetricResult = {
        name: t.name,
        url: t.url,
        performance: Math.round((categories.performance?.score ?? 0) * 100),
        accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
        bestPractices: Math.round((categories['best-practices']?.score ?? 0) * 100),
        seo: Math.round((categories.seo?.score ?? 0) * 100),
        lcp: audits['largest-contentful-paint']?.displayValue,
        lcpValue: audits['largest-contentful-paint']?.numericValue,
        cls: audits['cumulative-layout-shift']?.displayValue,
        clsValue: audits['cumulative-layout-shift']?.numericValue,
        tbt: audits['total-blocking-time']?.displayValue,
        tbtValue: audits['total-blocking-time']?.numericValue,
        speedIndex: audits['speed-index']?.displayValue,
        failingAudits,
        opportunities,
      };
      console.log(` -> Perf: ${scores.performance} | A11y: ${scores.accessibility} | BP: ${scores.bestPractices} | SEO: ${scores.seo} | LCP: ${scores.lcp} | CLS: ${scores.cls} | TBT: ${scores.tbt}`);
      results.push(scores);
      fs.unlinkSync(outFile);
    } else {
      throw new Error('Lighthouse output file was not generated.');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(` -> ERROR on ${t.name}: ${msg}`);
    results.push({ name: t.name, url: t.url, error: msg });
  }
}

fs.mkdirSync('audit', { recursive: true });
fs.writeFileSync('audit/lighthouse-summary.json', JSON.stringify(results, null, 2));
console.log('\nLighthouse audit complete. Saved to audit/lighthouse-summary.json');

