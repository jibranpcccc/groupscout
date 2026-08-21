import fs from 'fs';
import path from 'path';

console.log('Starting full static site crawl on dist/...');

const distPath = path.resolve(process.cwd(), 'dist');

if (!fs.existsSync(distPath)) {
  console.error('dist directory does not exist! Please run npm run build first.');
  process.exit(1);
}

function getAllHtmlFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllHtmlFiles(fullPath));
    } else if (file.endsWith('.html')) {
      results.push(fullPath);
    }
  });
  return results;
}

const htmlFiles = getAllHtmlFiles(distPath);
console.log(`Found ${htmlFiles.length} HTML files in dist/ to crawl and audit.`);

const GIBBERISH_PATTERNS = [
  { name: 'telescope URL/artifact', regex: /telescope|cdn\d?\.telesco\.pe/i },
  { name: 'Telegram download banner', regex: /telegram\.org\/dl|\[download(?:\s+telegram)?\]|download\(/i },
  { name: 'Raw subscriber header', regex: /\b\d+[KkMm]?\s+subscribers\s+\d+/i },
  { name: 'Keyboard smash / test string', regex: /\b(akshfd|asdfgh|qwertyuiop|lorem ipsum|test123|foobar)\b/i },
  { name: 'Raw JS object / undefined / null literal', regex: /\[object Object\]|\bundefined\b|\bNaN\b/i },
  { name: 'Character corruption / replacement char', regex: /\ufffd|\?\?\?\?/i },
];

let totalPagesCrawled = 0;
let totalGibberishCount = 0;
let totalPlaceholderCount = 0;
let totalCorruptionCount = 0;

const findings: Array<{ file: string; url: string; issue: string; snippet: string }> = [];

for (const file of htmlFiles) {
  totalPagesCrawled++;
  const relativePath = path.relative(distPath, file).replace(/\\/g, '/');
  const routeUrl = '/' + relativePath.replace(/index\.html$/, '');

  const content = fs.readFileSync(file, 'utf8');

  // Strip script, style, SVG tags to scan visible text & meta tags
  const visibleAndMeta = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ');

  for (const pattern of GIBBERISH_PATTERNS) {
    if (pattern.regex.test(visibleAndMeta)) {
      const match = visibleAndMeta.match(pattern.regex);
      const matchIdx = match?.index ?? 0;
      const snippet = visibleAndMeta.slice(Math.max(0, matchIdx - 40), Math.min(visibleAndMeta.length, matchIdx + 60)).replace(/\s+/g, ' ');
      
      findings.push({
        file: relativePath,
        url: routeUrl,
        issue: pattern.name,
        snippet,
      });

      if (pattern.name.includes('corruption')) {
        totalCorruptionCount++;
      } else if (pattern.name.includes('test') || pattern.name.includes('JS object')) {
        totalPlaceholderCount++;
      } else {
        totalGibberishCount++;
      }
    }
  }
}

console.log('\n=== CRAWL & CONTENT CLEANLINESS AUDIT RESULTS ===');
console.log(`Total Pages Crawled:             ${totalPagesCrawled}`);
console.log(`Public Gibberish Found:          ${totalGibberishCount}`);
console.log(`Public Placeholders Found:       ${totalPlaceholderCount}`);
console.log(`Public Character Corruption:     ${totalCorruptionCount}`);

if (findings.length > 0) {
  console.log('\nFindings Breakdown:');
  findings.slice(0, 20).forEach((f, i) => {
    console.log(`[${i + 1}] URL: ${f.url}`);
    console.log(`    Issue:   ${f.issue}`);
    console.log(`    Snippet: "${f.snippet}"`);
  });
  if (findings.length > 20) {
    console.log(`... and ${findings.length - 20} more findings.`);
  }
  process.exit(1);
} else {
  console.log('\n✅ 100% CLEAN: Zero public gibberish, zero scraped artifacts, zero corruption detected!');
}
