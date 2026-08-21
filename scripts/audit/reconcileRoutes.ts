import fs from 'fs';
import path from 'path';

const distPath = path.resolve(process.cwd(), 'dist');

function getAllDistFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllDistFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

const allFiles = getAllDistFiles(distPath);
const relativeFiles = allFiles.map((f) => path.relative(distPath, f).replace(/\\/g, '/'));

console.log(`Total files in dist: ${relativeFiles.length}`);

// Breakdown HTML routes vs Non-HTML assets
const htmlFiles = relativeFiles.filter((f) => f.endsWith('.html'));
const nonHtmlFiles = relativeFiles.filter((f) => !f.endsWith('.html'));

console.log(`Total generated HTML pages: ${htmlFiles.length}`);
console.log(`Total non-HTML files:      ${nonHtmlFiles.length}`);

// Categorize all 269 HTML routes
interface RouteItem {
  file: string;
  route: string;
  category: string;
  inSitemap: boolean;
  isNoindex: boolean;
}

const sitemapPath = path.resolve(distPath, 'sitemap-0.xml');
const sitemapXml = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf8') : '';
const sitemapUrls = new Set((sitemapXml.match(/<loc>(.*?)<\/loc>/g) || []).map((m) => m.replace(/<\/?loc>/g, '')));

const categories: Record<string, RouteItem[]> = {
  'Home & Core Directory': [],
  'Published Community Details': [],
  'Indexable Exam Pages': [],
  'Thin Exam Pages (noindex)': [],
  'Exam Category Pages': [],
  'Platform Pages': [],
  'Tag Pages': [],
  'Utility & Informational Pages': [],
  'Form & Technical Pages': [],
  'Error Pages (404)': [],
};

htmlFiles.forEach((file) => {
  const content = fs.readFileSync(path.resolve(distPath, file), 'utf8');
  const isNoindex = content.includes('noindex');
  const route = '/' + file.replace(/index\.html$/, '').replace(/\.html$/, '');
  const canonicalUrl = `https://groupscout.netlify.app${route.endsWith('/') ? route : route + '/'}`;
  const inSitemap = sitemapUrls.has(canonicalUrl) || sitemapUrls.has(canonicalUrl.replace(/\/$/, ''));

  let cat = 'Utility & Informational Pages';

  if (file === 'index.html' || file.startsWith('communities/')) {
    cat = 'Home & Core Directory';
  } else if (file.startsWith('group/')) {
    cat = 'Published Community Details';
  } else if (file.startsWith('exam/')) {
    cat = isNoindex ? 'Thin Exam Pages (noindex)' : 'Indexable Exam Pages';
  } else if (file.startsWith('category/')) {
    cat = 'Exam Category Pages';
  } else if (file.startsWith('platform/')) {
    cat = 'Platform Pages';
  } else if (file.startsWith('tag/')) {
    cat = 'Tag Pages';
  } else if (file === '404.html') {
    cat = 'Error Pages (404)';
  } else if (file.startsWith('submit/') || file.startsWith('report/')) {
    cat = 'Form & Technical Pages';
  } else if (['about/index.html', 'how-we-verify/index.html', 'privacy/index.html', 'terms/index.html', 'safety/index.html', 'recently-added/index.html', 'recently-updated/index.html'].includes(file)) {
    cat = 'Utility & Informational Pages';
  }

  categories[cat].push({ file, route, category: cat, inSitemap, isNoindex });
});

console.log('\n=== DETERMINISTIC ROUTE BREAKDOWN ===');
let totalCategorized = 0;
for (const [name, items] of Object.entries(categories)) {
  console.log(`- ${name.padEnd(32)}: ${items.length} routes`);
  totalCategorized += items.length;
}

console.log(`\nTotal Categorized:           ${totalCategorized} / ${htmlFiles.length}`);
console.log(`Unaccounted Routes:          ${htmlFiles.length - totalCategorized}`);
console.log(`Sitemap-indexed URLs:        ${sitemapUrls.size}`);
