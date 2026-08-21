async function crawlLiveSite() {
  console.log('Fetching live sitemap from https://groupscout.netlify.app/sitemap-0.xml ...');

  const sitemapRes = await fetch('https://groupscout.netlify.app/sitemap-0.xml');
  const sitemapXml = await sitemapRes.text();

  const urlMatches = sitemapXml.match(/<loc>(.*?)<\/loc>/g) || [];
  const liveUrls = urlMatches.map((m) => m.replace(/<\/?loc>/g, ''));

  // Key static and utility routes
  liveUrls.push('https://groupscout.netlify.app/');
  liveUrls.push('https://groupscout.netlify.app/communities/1/');
  liveUrls.push('https://groupscout.netlify.app/robots.txt');

  const uniqueUrls = Array.from(new Set(liveUrls));
  console.log(`Found ${uniqueUrls.length} live URLs to crawl concurrently.`);

  const GIBBERISH_PATTERNS = [
    { name: 'telescope URL/artifact', regex: /telescope|cdn\d?\.telesco\.pe/i },
    { name: 'Telegram download banner', regex: /telegram\.org\/dl|\[download(?:\s+telegram)?\]|download\(/i },
    { name: 'Raw subscriber header', regex: /\b\d+[KkMm]?\s+subscribers\s+\d+/i },
    { name: 'Keyboard smash / test string', regex: /\b(akshfd|asdfgh|qwertyuiop|lorem ipsum|test123|foobar)\b/i },
    { name: 'Raw JS object / undefined / null literal', regex: /\[object Object\]|\bundefined\b|\bNaN\b/i },
    { name: 'Character corruption / replacement char', regex: /\ufffd|\?\?\?\?/i },
  ];

  let crawledCount = 0;
  let gibberishCount = 0;
  let placeholderCount = 0;
  let corruptionCount = 0;
  const issues: Array<{ url: string; issue: string }> = [];

  const BATCH_SIZE = 25;
  for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
    const batch = uniqueUrls.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (url) => {
        try {
          const res = await fetch(url, { headers: { 'User-Agent': 'StudyScout-Auditor/1.0' } });
          crawledCount++;
          if (!res.ok) {
            issues.push({ url, issue: `HTTP status ${res.status}` });
            return;
          }
          const text = await res.text();
          const visible = text
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
            .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ');

          for (const pat of GIBBERISH_PATTERNS) {
            if (pat.regex.test(visible)) {
              issues.push({ url, issue: pat.name });
              if (pat.name.includes('corruption')) corruptionCount++;
              else if (pat.name.includes('test') || pat.name.includes('JS object')) placeholderCount++;
              else gibberishCount++;
            }
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          issues.push({ url, issue: `Fetch error: ${msg}` });
        }
      })
    );
  }

  console.log('\n=== LIVE NETLIFY PRODUCTION CRAWL RESULTS ===');
  console.log(`Live URLs Crawled:             ${crawledCount}`);
  console.log(`Public Gibberish Found:        ${gibberishCount}`);
  console.log(`Public Placeholders Found:     ${placeholderCount}`);
  console.log(`Public Character Corruption:   ${corruptionCount}`);

  if (issues.length > 0) {
    console.log('\nIssues found on live site:');
    issues.forEach((iss) => console.log(`  - ${iss.url}: ${iss.issue}`));
  } else {
    console.log('\n✅ 100% VERIFIED LIVE: Production site is completely free of gibberish, placeholders, and corruption!');
  }
}

crawlLiveSite();
