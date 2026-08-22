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

const files = getHtmlFiles('dist');

const forbiddenPatterns = [
  /100%\s+verified/i,
  /all\s+verified/i,
  /every\s+(?:group|community)\s+verified/i,
  /all\s+communities\s+checked\s+by\s+humans/i,
  /guaranteed\s+(?:safe|legitimate|verified)/i,
  /100%\s+safe/i,
  /largest\s+(?:directory|platform|database)/i,
  /best\s+study\s+group/i,
];

let violations = 0;

files.forEach((f) => {
  const content = fs.readFileSync(f, 'utf8');
  forbiddenPatterns.forEach((pattern) => {
    const match = content.match(pattern);
    if (match) {
      console.log(`VIOLATION in ${f}: "${match[0]}"`);
      violations++;
    }
  });
});

console.log(`=== CLAIM & LANGUAGE SCAN COMPLETE ===`);
console.log(`Total Files Scanned: ${files.length}`);
console.log(`Violations Found: ${violations}`);
