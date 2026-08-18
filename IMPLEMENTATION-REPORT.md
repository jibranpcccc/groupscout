# Implementation Report — Community Directory

**Project path:** `C:\HermesWork\community-directory`
**Built:** August 18, 2026 — Astro 5.18 · Tailwind 4.3 · TypeScript 5.9 strict

## Build Status (all executed, all passing)

```
npm run typecheck:     PASS   (astro check + tsc --noEmit, 0 errors / 0 warnings)
npm run lint:          PASS   (eslint flat config, 0 errors)
npm run test:          PASS   (vitest, 6 files / 52 tests)
npm run validate-data: PASS   (12 published + 1 pending records schema-valid, no duplicates)
npm run build:         PASS   (44 static pages + sitemap + robots.txt + rss.xml)
```

Live smoke test (astro preview): all routes 200; unknown route → 404. Client-side
search (`?q=defi` → 1 result) and platform filters (`?platform=telegram` → 5
results, URL rewrites) verified in a real browser with screenshots.

## What Was Built

**Site (Astro SSG + Tailwind 4 + TypeScript strict)**
- Homepage with hero ("Find Communities Worth Joining"), search, real dataset
  counters, platform/category navigation, recently added + recently checked,
  safety notice, submission CTA.
- Directory: `/communities/` (+ static pagination), `/category/[slug]`,
  `/platform/[slug]`, `/tag/[slug]` (only tags with ≥2 listings — no thin pages),
  `/group/[slug]`, `/recently-added/`, `/recently-updated/`.
- Full client-side search/filter/sort over the embedded dataset — no server,
  shareable query params, no-JS fallback (content is in the static HTML).
- Honest verification & status badges (never a fake "Verified"), financial
  disclaimers on crypto/forex/earning categories, "Featured" as editorial only.
- Trust/legal pages: safety, how-we-verify, editorial-policy, about, contact,
  privacy, terms, disclaimer, 404 (with search + categories).
- SEO: unique titles, meta descriptions, canonical URLs from `PUBLIC_SITE_URL`,
  Open Graph/Twitter, JSON-LD (WebSite, Organization, CollectionPage,
  BreadcrumbList, WebPage), sitemap, robots.txt, RSS feed.
- Dark mode (system-aware + toggle), responsive, accessible (skip link, focus
  states, labels, reduced motion), zero third-party requests.
- Netlify Forms: `/submit/`, `/report/`, `/contact` with honeypots + success
  pages; reports never auto-remove; submissions go to the Forms inbox for
  manual review (documented flow).

**Discovery engine (`npm run discover`)**
- Deterministic query generation (platform × category × tag), budget-capped
  (env-configurable), provider abstraction (Gemini + Google Search grounding,
  manual seeds, disabled Telegram adapter).
- Only real grounding URLs count as evidence — Gemini prose is never a source.
- Normalize → dedupe (URL/identity/slug/title, ambiguous → review) → classify
  (Gemini structured output, Zod-validated) → moderation (hard-reject list,
  risk-language flags) → confidence gate → **pending-groups.json** by default.
- `--dry-run` / `--limit` / `--seeds`, atomic writes, structured logs.
- Verified end-to-end with seed URLs: 3 seeds → 2 candidates (1 dup removed) →
  2 pending records; `npm run approve -- <id>` published one correctly.

**Link health engine (`npm run validate-links`)**
- Platform adapters (telegram web preview, Discord public invite API, WhatsApp
  cautious check, generic) — public signals only, never joins anything.
- Cautious transitions with an internal failure counter: first strong failure →
  `unknown`, repeated 404/410 → `dead`, recovery → `active`; bot-blocking is
  never death; report/removed are never overwritten. Verified over two passes.

**Automation & ops**
- GitHub Actions: `discover-groups.yml` (daily 04:17 UTC), `validate-groups.yml`
  (Mon/Thu), `quality-check.yml` (CI gate) — graceful on failures, bot commits
  only real data changes, secrets via repo secrets.
- `netlify.toml` (build/publish/security headers/redirects), `.env.example`,
  AGENTS.md (engineering constitution), README (start-to-finish operations),
  Zod schema validation, stable atomic JSON writes.

## File structure (highlights)

```
C:\HermesWork\community-directory\
├── AGENTS.md                      # persistent engineering constitution
├── README.md                      # full operations + deployment guide
├── .env.example  .gitignore  netlify.toml  astro.config.mjs  tsconfig.json
├── .github/workflows/             # discover / validate-links / quality-check
├── docs/screenshots/              # live verification screenshots
├── scripts/
│   ├── discover/                  # index, generateQueries, geminiSearch,
│   │                              # parseCandidates, discoverySources
│   ├── classify/                  # classifyCommunity (Gemini), normalizeMetadata
│   ├── validate/                  # index, telegram/discord/whatsapp/generic
│   ├── data/                      # io (atomic), deduplicate, mergeListings,
│   │                              # normalizeUrl, validateSchema, stats, approve
│   └── utilities/                 # logging, moderation keyword lists
├── src/
│   ├── pages/                     # 25 routes (index, communities, category,
│   │                              # platform, tag, group, forms, trust/legal, 404)
│   ├── components/                # 15 components (cards, badges, filters, …)
│   ├── layouts/                   # BaseLayout, DirectoryLayout
│   ├── lib/                       # communities, filters, search, schema, seo,
│   │                              # urls, dates, language (repository layer)
│   ├── config/                    # site, categories, platforms, discovery
│   ├── data/                      # groups.json (12 samples), pending, seeds
│   ├── scripts/directory.ts       # client search/filter/pagination
│   ├── styles/global.css          # Tailwind 4 design tokens
│   └── types/community.ts
└── tests/                         # 52 vitest tests (urls, dedupe, schema,
                                   # filters, related, categories)
```

## Required user actions

1. Create a Gemini API key → https://aistudio.google.com/apikey
2. Add `GEMINI_API_KEY` to GitHub repo **secrets** (Settings → Secrets → Actions)
3. Create a GitHub repository and push this folder
4. Import the repo into Netlify (reads `netlify.toml` automatically)
5. Set `PUBLIC_SITE_URL` in Netlify (Site settings → Environment variables)
6. **Remove the sample data** before production — see README "Removing sample data"
7. Optionally replace branding: `src/config/site.ts`, `public/favicon.svg`,
   `public/images/og-default.svg`

## Commands

```bash
npm run dev
npm run build
npm run discover -- --dry-run
npm run discover
npm run validate-links
npm run data:stats
npm run approve -- <candidate-id>
```

## Credentials needed

- `GEMINI_API_KEY` — discovery only; the site builds and runs without it.
- All other values are in `.env.example` with defaults.

## Known limitations (V1, by design)

- Discovery is limited to publicly indexed URLs on each platform; WhatsApp and
  Discord in particular cannot be globally enumerated.
- The site never joins groups, so some statuses stay `unknown` indefinitely.
- Member counts only appear with a real source; no ratings/growth metrics exist.
- Sample data must be removed before production (all marked `isSample: true`).
- Netlify Forms submissions require manual review → data commit → rebuild.
- A user-level git hook at `C:\Users\jibra\.git-hooks\post-commit` throws
  "Exec format error" on every commit — harmless (commits still succeed), but
  it may need fixing in the user's global git config.
