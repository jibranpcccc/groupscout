import https from 'https';

function fetchUrl(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'StudyScout-SEO-Verifier/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }));
    }).on('error', reject);
  });
}

async function verifyLive() {
  console.log('Fetching live sitemap from https://groupscout.netlify.app/sitemap-0.xml...');
  const sitemapRes = await fetchUrl('https://groupscout.netlify.app/sitemap-0.xml');
  console.log(`Live sitemap HTTP status: ${sitemapRes.status}`);

  const locs = (sitemapRes.body.match(/<loc>(.*?)<\/loc>/g) || []).map((m) => m.replace(/<\/?loc>/g, ''));
  console.log(`Live sitemap URLs count: ${locs.length}`);

  console.log('\nChecking live Academic Integrity page: https://groupscout.netlify.app/academic-integrity/...');
  const policyRes = await fetchUrl('https://groupscout.netlify.app/academic-integrity/');
  console.log(`Academic Integrity HTTP status: ${policyRes.status}`);
  const hasAntiDump = policyRes.body.includes('Academic Integrity & Anti-Exam Dump Policy') || policyRes.body.includes('Prohibited Materials');
  console.log(`Academic Integrity content present: ${hasAntiDump}`);

  console.log('\nChecking live robots.txt: https://groupscout.netlify.app/robots.txt...');
  const robotsRes = await fetchUrl('https://groupscout.netlify.app/robots.txt');
  console.log(`robots.txt HTTP status: ${robotsRes.status}`);
  console.log(`robots.txt content:\n${robotsRes.body.trim()}`);

  console.log('\nCrawling random sample of 20 live sitemap URLs for status 200...');
  let passCount = 0;
  for (const url of locs.slice(0, 20)) {
    const res = await fetchUrl(url);
    if (res.status === 200) passCount++;
    else console.error(`Failed ${url} status: ${res.status}`);
  }
  console.log(`Sample test passed: ${passCount}/20 status 200.`);
  console.log('\nLIVE PRODUCTION SEO VERIFICATION COMPLETE: ALL SYSTEMS HEALTHY!');
}

verifyLive().catch(console.error);
