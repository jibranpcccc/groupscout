import { execSync } from 'child_process';

const testUrls = [
  'http://studygroupshub.com/',
  'https://studygroupshub.com/',
  'http://www.studygroupshub.com/',
  'https://www.studygroupshub.com/',
  'https://groupscout.netlify.app/',
  'https://groupscout.netlify.app/exam/ielts/',
  'https://groupscout.netlify.app/category/english-proficiency/',
  'https://groupscout.netlify.app/sitemap-index.xml',
  'https://groupscout.netlify.app/robots.txt',
  'https://studygroupshub.com/sitemap-index.xml',
  'https://studygroupshub.com/robots.txt',
];

console.log('=== LIVE DOMAIN & REDIRECT AUDIT ===\n');

for (const url of testUrls) {
  try {
    const cmd = `curl.exe -s -I -L -m 10 -o NUL -w "URL: %{url_effective} | Code: %{http_code} | Redirects: %{num_redirects}" "${url}"`;
    const res = execSync(cmd, { encoding: 'utf8' }).trim();
    console.log(`[${url}] -> ${res}`);
  } catch (err: any) {
    console.log(`[${url}] -> ERROR: ${err.message}`);
  }
}
