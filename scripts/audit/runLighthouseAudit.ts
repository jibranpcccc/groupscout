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

const results: any[] = [];

for (const t of targets) {
  const outFile = `audit/temp-lh-${Date.now()}.json`;
  try {
    console.log(`Auditing ${t.name}: ${t.url}...`);
    const cmd = `npx lighthouse "${t.url}" --output=json --output-path=${outFile} --chrome-flags="--headless=new --no-sandbox" --form-factor=mobile --screenEmulation.mobile=true --throttling-method=simulate --quiet`;
    try {
      execSync(cmd, { encoding: 'utf8', timeout: 90000 });
    } catch (e) {
      // Chrome launcher on Windows can trigger EPERM on temp dir deletion even after writing output
    }
    
    if (fs.existsSync(outFile)) {
      const lhData = JSON.parse(fs.readFileSync(outFile, 'utf8'));
      const categories = lhData.categories;
      const scores = {
        name: t.name,
        url: t.url,
        performance: Math.round((categories.performance?.score ?? 0) * 100),
        accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
        bestPractices: Math.round((categories['best-practices']?.score ?? 0) * 100),
        seo: Math.round((categories.seo?.score ?? 0) * 100),
      };
      console.log(` -> Perf: ${scores.performance} | A11y: ${scores.accessibility} | BP: ${scores.bestPractices} | SEO: ${scores.seo}`);
      results.push(scores);
      fs.unlinkSync(outFile);
    } else {
      throw new Error('Lighthouse output file was not generated.');
    }
  } catch (err: any) {
    console.log(` -> ERROR on ${t.name}: ${err.message}`);
    results.push({ name: t.name, url: t.url, error: err.message });
  }
}

fs.mkdirSync('audit', { recursive: true });
fs.writeFileSync('audit/lighthouse-summary.json', JSON.stringify(results, null, 2));
console.log('\nLighthouse audit complete. Saved to audit/lighthouse-summary.json');
