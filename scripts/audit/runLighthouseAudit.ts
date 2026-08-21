import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const urls = [
  { name: 'Homepage', url: 'https://groupscout.netlify.app/' },
  { name: 'Directory Root', url: 'https://groupscout.netlify.app/communities/' },
  { name: 'IELTS Exam Hub', url: 'https://groupscout.netlify.app/exam/ielts/' },
  { name: 'USMLE Exam Hub', url: 'https://groupscout.netlify.app/exam/usmle/' },
  { name: 'Telegram Platform Hub', url: 'https://groupscout.netlify.app/platform/telegram/' },
  { name: 'Community Detail Page', url: 'https://groupscout.netlify.app/group/telegram-cambridge-ielts-practice-official/' },
];

const auditDir = path.resolve(process.cwd(), 'audit');
if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });

const results: any[] = [];

for (const item of urls) {
  console.log(`Running Lighthouse mobile audit for ${item.name}: ${item.url}...`);
  const tempJson = path.join(auditDir, `lh-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`);
  
  try {
    execSync(
      `npx lighthouse ${item.url} --output=json --output-path="${tempJson}" --chrome-flags="--headless=new --no-sandbox" --quiet`,
      { stdio: 'pipe', timeout: 120000 }
    );
    const lh = JSON.parse(fs.readFileSync(tempJson, 'utf8'));
    const perfScore = Math.round((lh.categories.performance?.score ?? 0) * 100);
    const a11yScore = Math.round((lh.categories.accessibility?.score ?? 0) * 100);
    const bpScore = Math.round((lh.categories['best-practices']?.score ?? 0) * 100);
    const seoScore = Math.round((lh.categories.seo?.score ?? 0) * 100);
    const fcp = lh.audits['first-contentful-paint']?.displayValue ?? 'N/A';
    const lcp = lh.audits['largest-contentful-paint']?.displayValue ?? 'N/A';
    const cls = lh.audits['cumulative-layout-shift']?.displayValue ?? '0';
    const tbt = lh.audits['total-blocking-time']?.displayValue ?? '0 ms';

    results.push({
      page: item.name,
      url: item.url,
      performance: perfScore,
      accessibility: a11yScore,
      bestPractices: bpScore,
      seo: seoScore,
      fcp,
      lcp,
      cls,
      tbt,
    });
    console.log(`✓ ${item.name}: Perf ${perfScore} | A11y ${a11yScore} | BP ${bpScore} | SEO ${seoScore} | LCP ${lcp} | CLS ${cls}`);
  } catch (err: any) {
    console.error(`Failed lighthouse on ${item.url}:`, err.message);
  }
}

fs.writeFileSync(path.join(auditDir, 'lighthouse-summary.json'), JSON.stringify(results, null, 2), 'utf8');
console.log('\nAll Lighthouse audits completed!');
