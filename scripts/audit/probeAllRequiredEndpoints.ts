import https from 'https';

interface ProbeResult {
  url: string;
  status: number;
  robotsMeta: string | null;
  canonical: string | null;
  title: string | null;
  h1: string | null;
  inSitemap: boolean | null;
}

function probeUrl(url: string): Promise<{ status: number; headers: any; body: string }> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'StudyScout-Production-Integrity-Auditor/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function runProbes() {
  const base = 'https://groupscout.netlify.app';
  const urls = [
    `${base}/`,
    `${base}/communities/`,
    `${base}/exam/ielts/`,
    `${base}/exam/usmle/`,
    `${base}/platform/telegram/`,
    `${base}/group/telegram-ielts-speaking-for-success/`,
    `${base}/group/telegram-officersias/`,
    `${base}/academic-integrity/`,
    `${base}/robots.txt`,
    `${base}/sitemap-index.xml`,
    `${base}/sitemap-0.xml`,
    `${base}/404/`,
    `${base}/nonexistent-audit-test-404/`,
  ];

  console.log('Probing Live Production Endpoints on https://groupscout.netlify.app/ ...\n');

  for (const u of urls) {
    try {
      const res = await probeUrl(u);
      const isHtml = (res.headers['content-type'] || '').includes('text/html');
      let title = null;
      let h1 = null;
      let robots = null;
      let canonical = null;

      if (isHtml) {
        const titleMatch = res.body.match(/<title>(.*?)<\/title>/i);
        if (titleMatch) title = titleMatch[1];

        const h1Match = res.body.match(/<h1[^>]*>(.*?)<\/h1>/is);
        if (h1Match) h1 = h1Match[1].replace(/<[^>]+>/g, '').trim();

        const robotsMatch = res.body.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
        if (robotsMatch) robots = robotsMatch[1];

        const canMatch = res.body.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
        if (canMatch) canonical = canMatch[1];
      }

      console.log(`URL: ${u}`);
      console.log(`  HTTP Status : ${res.status}`);
      if (isHtml) {
        console.log(`  Title       : ${title}`);
        console.log(`  H1          : ${h1}`);
        console.log(`  Robots Meta : ${robots ?? 'none (default index,follow)'}`);
        console.log(`  Canonical   : ${canonical}`);
      } else {
        console.log(`  Content-Type: ${res.headers['content-type']}`);
        console.log(`  Snippet     : ${res.body.slice(0, 120).replace(/\n/g, ' ')}...`);
      }
      console.log('');
    } catch (e: any) {
      console.error(`Error probing ${u}: ${e.message}`);
    }
  }
}

runProbes();
