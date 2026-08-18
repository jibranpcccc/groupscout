# AGENTS.md — Community Directory Engineering Constitution

This file is the persistent engineering contract for this repository.
Future Hermes (or other AI) sessions MUST read this file before modifying the project.

## 1. Project purpose

A production-ready, automated directory website for discovering and cataloguing
**public online communities** on Telegram, WhatsApp and Discord (Reddit, Slack,
Facebook Groups, Skool, GitHub Discussions and public forums are future platforms).

It is **not** a messaging platform and **not** a marketing-content farm.
It is a searchable, filterable, categorized directory of publicly discoverable
communities built on **real structured information**.

## 2. Architecture

- **Astro 5** (static site generation), **TypeScript (strict)**, **Tailwind CSS 4**,
  **Node.js 20+**, **JSON data store (V1)**, **GitHub Actions**, **Netlify**,
  **Gemini API** for AI classification/discovery.
- Static HTML everywhere practical. No database required to render content in V1.
- Data access is centralized behind `src/lib/communities.ts` so a future
  Supabase/PostgreSQL migration only touches the repository layer.
- All network-based work lives in scripts (`npm run discover`, `npm run validate-links`),
  never in the build. The production build must be deterministic and offline.

## 3. Supported platforms

Configured centrally in `src/config/platforms.ts` (id, name, hostname patterns,
icon, validation adapter). **Never** scatter `if (platform === 'telegram')` logic
across components — extend the platform config instead.

## 4. Data integrity rules (non-negotiable)

1. **Never fabricate data**: community names, invite URLs, member counts, growth
   statistics, ratings, reviews, founders, locations, verification status,
   descriptions presented as factual, activity statistics, dates, source URLs,
   pricing, endorsements. If unknown → `null` / `"unknown"`, and the UI hides it.
2. **No fake "Verified" badges.** Only these verification states exist:
   `unverified | source-confirmed | owner-confirmed | manually-reviewed`.
3. **Member counts only when sourced**: store `memberCount`, `memberCountSource`,
   `memberCountCheckedAt` together, or all `null`. Never estimate.
4. **No ratings/reviews/growth metrics in V1.** No "trending", "fastest growing",
   "4.9 stars". "Featured" is an explicit editorial config field only.
5. **Public content only.** The discovery system must never join private groups,
   bypass login walls/CAPTCHAs/anti-bot protections, scrape private messages or
   member profiles, impersonate users, create fake accounts, message admins, or
   crawl prohibited resources. If a source blocks automation → `status = unknown`.
6. **`src/data/groups.json` is the source of truth** for published listings;
   `src/data/pending-groups.json` holds discoveries that need review. Discovery
   results default to `pending` unless `AUTO_PUBLISH_DISCOVERED=true` (keep false).
7. **Do not rewrite JSON files unnecessarily.** Load → validate → normalize →
   modify → deduplicate → validate again → write atomically (temp file + rename).
8. **Do not copy full third-party content.** Use factual metadata and concise
   original summaries based on evidence. Store original source URLs.

## 5. TypeScript conventions

- Strict mode. Avoid `any` unless genuinely unavoidable (then document it).
- Prefer explicit interfaces; string-literal union types over enums.
- Use `import type { ... }` for type-only imports (verbatimModuleSyntax).
- No `import.meta.env` usage outside Astro (`src/`): node scripts (`scripts/`)
  load env via `dotenv/config` and must not import `src/config/site.ts`.
- Scripts and `src/lib` shared modules must be pure Node-compatible TS
  (they are executed by `tsx`, not compiled by Astro).

## 6. Component conventions

- Components are small, presentational, and receive data via props.
- Astro islands/JS only where interaction genuinely requires it (search, filters,
  mobile menu, theme toggle). Directory content is present in the rendered HTML.
- External links use `rel="noopener noreferrer"`. Do not blanket-apply `nofollow`
  without evaluating the purpose.
- Reusable design tokens live in `src/styles/global.css` (`@theme`).
  Visual style stays restrained and professional — no casino/spam aesthetics.

## 7. SEO conventions

- Every indexable page gets a unique title + meta description + canonical
  (built from `PUBLIC_SITE_URL`, never a Netlify preview URL) + OG/Twitter tags.
- Central helpers in `src/lib/seo.ts`; site values in `src/config/site.ts`.
- Indexation rules: no empty category pages, no empty tag pages (tags need
  `TAG_PAGE_MIN_COMMUNITIES` listings), no arbitrary filter-permutation pages,
  no programmatic SEO spam. Search/filter query permutations canonicalize to
  the base directory URL. Sitemap excludes utility routes.
- Structured data only where semantically appropriate (WebSite, CollectionPage,
  ItemList, BreadcrumbList, WebPage, Organization). **Never** fake Review /
  AggregateRating / Product schema.
- Financial categories (crypto, forex, online earning) render a neutral
  disclaimer; directory inclusion is never an endorsement.

## 8. Discovery architecture

Pipeline: query generation → public search source (Gemini with Google Search
grounding, or manual seeds) → candidate URLs → URL normalization → duplicate
detection → validation → Gemini classification → confidence checks → pending or
published dataset.

- Providers implement `DiscoveryProvider { search(query) }` (see
  `scripts/discover/discoverySources.ts`). Do not build unofficial platform
  exploitation; credential-required adapters stay disabled until configured.
- Gemini may classify, categorize, tag, summarize evidence and flag risky
  wording. Gemini must **never** invent URLs/member counts/reviews, declare a
  community safe, or endorse it.
- A real URL must exist as evidence — Gemini's prose is not a source.
- Free-tier reality: Google Search grounding is usually quota-blocked on free
  API keys (429, handled gracefully); classification (plain generateContent)
  works. `seeds.json` + classification is the full free-tier discovery path.
- Recommended free search providers: Brave Search API (`BRAVE_API_KEY`,
  scripts/discover/braveSearch.ts) or Tavily (`TAVILY_API_KEY`,
  scripts/discover/tavilySearch.ts) — both have free tiers (1,000-2,000
  queries/month), real web index, platform-filtered candidates. Gemini
  remains the free classifier.
- The classifier intentionally avoids `responseSchema` (it triggers
  pathological repeated-token output on some flash models) — it uses a strict
  JSON prompt, `maxOutputTokens` cap, one retry, JSON salvage and Zod
  validation instead. Default model `gemini-3.5-flash-lite` is the most
  reliable free-tier choice.
- Budget controls in `src/config/discovery.ts` + env overrides; `--dry-run`
  and `--limit` supported. Structured logs, no secrets printed.

## 9. Link validation

`npm run validate-links` checks stored destination URLs with per-platform
adapters (see `scripts/validate/`). Cautious transitions only:
first failure → `unknown`; repeated strong 404/invalid evidence → `dead`;
manual report → `reported`. Never guess; bot-blocking must not produce `dead`.
Update `lastCheckedAt` for every check. Respect rate limits and delays.

## 10. Moderation rules

Reject/flag: malware, phishing, stolen credentials, sexual exploitation, illegal
weapons marketplaces, illicit drug sales, terrorist recruitment, fraudulent
impersonation, obvious financial scams, credential dumps. When uncertain →
`pending`, never auto-publish. Financial-risk wording (e.g. "guaranteed
profits") is stored in `safetyFlags` as `potential-risk-language` and requires
manual review — it never automatically marks a listing a scam.

## 11. Commands

```bash
npm install
npm run dev            # local dev server
npm run build          # production build (must pass before any "done" claim)
npm run preview        # serve the production build locally
npm run typecheck      # astro check + tsc --noEmit
npm run lint           # eslint
npm run test           # vitest
npm run validate-data  # schema + duplicate validation of JSON data
npm run discover -- --dry-run   # plan only, no writes
npm run discover       # Gemini discovery → pending-groups.json
npm run validate-links # link health check (network)
npm run data:stats     # dataset summary
npm run approve -- <id>  # move a pending listing into groups.json
```

## 12. Environment variables

See `.env.example`. Never commit real `.env` files. Secrets go in GitHub
Actions secrets / Netlify environment variables, never in workflow YAML.
Required for discovery only: `GEMINI_API_KEY`. The site builds and runs
without any env vars set.

## 13. GitHub Actions

- `.github/workflows/discover-groups.yml` — daily scheduled discovery
  (non-peak cron), commits only real data changes with a bot commit.
- `.github/workflows/validate-groups.yml` — scheduled link health, commits
  meaningful status changes.
- `.github/workflows/quality-check.yml` — typecheck/lint/test/validate-data/
  build on pushes and PRs.

Workflows must gracefully handle quota exhaustion, Gemini errors, transient
network errors, malformed candidates, merge races, empty discoveries and
duplicates. One bad candidate must never break the run.

## 14. Forms

- `/submit/` and `/report/` use Netlify static forms (`data-netlify="true"`,
  honeypot field, hidden `form-name`). Submissions land in the Netlify Forms
  inbox for manual review — they are NOT automatically written to JSON.
- Reports never auto-remove a listing; manual moderation is authoritative.
- Admin contact from forms stays private; never place emails in static JSON.

## 15. Testing

Tests live in `tests/` (vitest) and target critical pure functions: URL
normalization, deduplication, slug behavior, schema validation, filters,
category matching, related-community selection. No superficial HTML-text tests.
Before declaring completion, run the full quality suite
(`npm run typecheck && npm run lint && npm run test && npm run validate-data && npm run build`)
and fix every failure.

## 16. Deployment

Netlify: build command `npm run build`, publish directory `dist`, set
`PUBLIC_SITE_URL`. GitHub: configure `GEMINI_API_KEY` in repository secrets.
Full instructions in `README.md`.
