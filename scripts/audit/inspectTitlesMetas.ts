import fs from 'fs';
import path from 'path';

function getHtmlFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getHtmlFiles(fullPath));
    } else if (file.endsWith('.html')) {
      results.push(fullPath);
    }
  });
  return results;
}

interface RouteMetadata {
  route: string;
  title: string;
  desc: string;
  canonical: string;
  h1: string;
}

const htmlFiles = getHtmlFiles('dist');
const indexableRoutes: RouteMetadata[] = [];

htmlFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');

  const robotsMatch = content.match(/<meta\s+name=["']robots["']\s+content=["'](.*?)["']/i);
  const robots = robotsMatch ? robotsMatch[1] : '';
  if (robots.includes('noindex')) return;

  const relPath = path.relative('dist', file).replace(/\\/g, '/');
  const route = '/' + (relPath === 'index.html' ? '' : relPath.replace(/\/index\.html$/, '/'));

  const titleMatch = content.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1] : '';

  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
  const desc = descMatch ? descMatch[1] : '';

  const canonicalMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i);
  const canonical = canonicalMatch ? canonicalMatch[1] : '';

  const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';

  indexableRoutes.push({
    route,
    title,
    desc,
    canonical,
    h1,
  });
});

console.log('Total Indexable Routes:', indexableRoutes.length);
console.log('All Indexable Routes Table:');
indexableRoutes.forEach((r, idx) => {
  console.log(`[${idx + 1}] Route: ${r.route}`);
  console.log(`     Title: ${r.title}`);
  console.log(`     H1:    ${r.h1}`);
  console.log(`     Desc:  ${r.desc}`);
  console.log(`     Canon: ${r.canonical}\n`);
});

