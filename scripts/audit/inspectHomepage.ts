import fs from 'fs';

const html = fs.readFileSync('dist/index.html', 'utf8');

console.log('Title:', html.match(/<title>(.*?)<\/title>/)?.[1]);
console.log('H1:', html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.trim());
console.log('Canonical:', html.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/)?.[1]);
console.log('OG Site Name:', html.match(/<meta\s+property=["']og:site_name["']\s+content=["'](.*?)["']/)?.[1]);
console.log('OG Title:', html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/)?.[1]);
console.log('OG URL:', html.match(/<meta\s+property=["']og:url["']\s+content=["'](.*?)["']/)?.[1]);
console.log('Twitter Card:', html.match(/<meta\s+name=["']twitter:card["']\s+content=["'](.*?)["']/)?.[1]);

const scripts = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
scripts.forEach((s, i) => {
  console.log('JSON-LD Block ' + (i + 1) + ':\n' + s.replace(/<[^>]+>/g, '').trim());
});
