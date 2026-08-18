# Production Audit Evidence — GroupScout (2026-08-18)

All checks executed against the PUBLIC site, not localhost.

## Build & repo

- Branch: `main` · HEAD: `06d9f8c` (clean working tree)
- typecheck: PASS · lint: PASS · tests: PASS (60/60, 7 files) · validate-data: PASS · build: PASS

## Deployment

- Netlify Site ID: `d0979188-a441-489b-b61a-86d9d770ce9b`
- Netlify Deploy ID (final): `6a845e009512e7257d916da8` (ready)
- Production URL: https://groupscout.netlify.app

## Dataset (real only)

- Published REAL communities: **0** (groups.json is `[]` — demo data purged)
- Demo communities: **0** (was 12)
- Pending (review queue, real URLs, independently validated):
  - `cand-msymjmqr-7k7g3i` t.me/durov — telegram — status unknown (preview blocked from this network; channel is real)
  - `cand-msymjobp-u1035o` discord.gg/python — **active** (Discord official API: guild "Python")
  - `cand-msymjpvi-ujttw8` t.me/python — telegram — status unknown
  - `cand-msyoymmj-b3watk` discord.gg/reactiflux — **active** (Discord API: guild "Reactiflux")
  - `cand-msyoyoc8-3rpss3` discord.gg/freecodecamp — **dead** (Discord API 404 — removed from seeds)
  - `cand-msyoyq1x-0dfjp8` discord.gg/godot — **dead** (Discord API 404 — removed from seeds)
- Member counts: none stored (public Discord endpoint returns guild name only — never fabricated)

## Public site verification

- Demo-string scan (/(Demo)/, /Demo fixture/, /example.com\/demo/) across /, /communities/, /category/ai-tech/, /platform/*, /recently-added/, /recently-updated/: **0 hits**
- Old demo page /group/ai-builders-lounge/: **404**
- Homepage: title "GroupScout", canonical `https://groupscout.netlify.app/`, "New communities are being reviewed" empty-state (counters = 0/5/3/0, computed, not hardcoded)
- noindex confirmed live: /category/ai-tech/ (0 real < 3), /recently-added/, /recently-updated/, /submit/, /report/
- robots.txt → production sitemap-index.xml
- sitemap (13 URLs, zero localhost): /, /about/, /communities/, /contact/, /disclaimer/, /editorial-policy/, /how-we-verify/, /platform/{discord,telegram,whatsapp}/, /privacy/, /safety/, /terms/
- Security headers verified live: X-Content-Type-Options: nosniff · X-Frame-Options: DENY · Referrer-Policy: strict-origin-when-cross-origin · Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=() · Content-Security-Policy: default-src 'self'…

## Guardrails added this pass

- `findProductionViolations` (src/lib/schema.ts) — validate-data FAILS on any isSample / example.com / "(Demo)" / "Demo fixture" record; 7 unit tests
- `npm run approve` refuses demo records
- Telegram validator rejects personal/contact pages (HTTP 200 ≠ active)
- Discord validator uses official API `?with_counts=true`, requires guild object; stores member counts only when the API returns them
- Sitemap filter computes real counts from groups.json; thin tags (<5) & empty categories (<3) noindex + excluded; recently pages noindex + excluded
- Gemini retained (classifier); Gemini API key NOT exposed (gitignored .env, secrets only); AUTO_PUBLISH_DISCOVERED=false

## Remaining for user

1. Review pending: `npm run approve -- <id>` for the 4 real candidates (2 active, 2 unknown-but-real)
2. Delete the 2 dead pending records (freecodecamp, godot)
3. Do NOT submit to Google Search Console until real listings are approved & verified
4. Optionally add a free search key (Tavily/Brave) for daily auto-discovery
