# SEO Roast Roadmap: studygroupshub.com (2026-11-26)

Verdict: Crawl and sitemap parity are healthy, but broken heading hierarchy, a static drifting `llms.txt`, thin contact content, and underlinked certification hubs were holding back on-page topical equity.

| # | Tier | Issue | Impact | Fix | Owner | Status |
|---|---|---|---|---|---|---|
| 1 | FATAL | `CommunityCard` used `<h2>` inside grids without a parent `<h2>` (`h1 -> h3`/polluted outline) | Broken document hierarchy across all directory, category, and platform hubs | Converted cards to `<h3>`, added `<h2 class="sr-only">` section headings, enforced `HEADING HIERARCHY SKIPS: 0` in `seoAudit.ts` | agent | shipped |
| 2 | REVENUE | Static `public/llms.txt` drifted from live dataset counts | AI answer engines read stale counts instead of live 160-listing / 16-exam inventory | Replaced with dynamic `src/pages/llms.txt.ts` computed from `groups.json` | agent | shipped |
| 3 | REVENUE | Underlinked indexable hubs (`/exam/pmp/`, `/exam/cissp/`, `/exam/cpa/`, `/exam/lsat/`, `/exam/usmle/`, `/platform/*`) had <3-5 contextual body links | New and niche hubs starved of internal body PageRank | Added cross-cluster exam links, platform links on detail & exam pages, and natural contextual links in trust pages | agent | shipped |
| 4 | REVENUE | `/contact/` indexable page had only 36 main-body words + raw slug fallbacks on cards (`categorized under entrance-exams`) | Thin-page risk and awkward snippet copy | Expanded `/contact/` to 250+ words of inquiry/moderation guidance and humanized card fallbacks | agent | shipped |
| 5 | REVENUE | 75 editorial slop tells (em/en dashes, curly quotes, decorative emojis, non-question hub H2s) | Lower AI answer-engine extractability and generic prose | Rewrote hub H2s as user questions, cleaned all dashes/curly quotes/emojis, shortened trust titles | agent | shipped |
| 6 | COMPOUNDING | 96 published Telegram listings lack descriptions (<60 chars -> `noindex`) | 122 of 160 detail pages excluded from Google sitemap | Backfill real public descriptions from `t.me/s/` via Tavily Extract in networked pass | owner / bot | next |
| 7 | COMPOUNDING | 4 exam hubs sit at 4 listings (`act`, `mcat`, `ap-exams`, `aws`) | Each is 1 active listing short of the `>= 5` indexability gate | Source 1 more active verified community per exam to unlock 4 more indexable hubs | owner / bot | next |
| 8 | COMPOUNDING | Young domain (~3 months) needs editorial referring domains | Competitive exam head terms favor high-DR domains | Expand outreach & directory submissions pointing directly at `/exam/*` hubs and `#pacing-calculator` | owner | next |

## Verification Commands

```powershell
npm run typecheck; npm run lint; npm run test; npm run validate-data; npm run build; npm run seo:audit
```
