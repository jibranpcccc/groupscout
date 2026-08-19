# AGENTS.md — StudyScout Engineering Constitution

This file is the persistent engineering contract for this repository.
Future Hermes (or other AI) sessions MUST read this file before modifying the project.

> **This project is an exam-preparation and professional-certification community
> directory. Do not reintroduce unrelated general-community niches without
> explicit owner approval.**

The site's single vertical is `study-prep`: public study communities on
Telegram, WhatsApp and Discord for entrance exams, admissions tests,
professional licensing exams, English-language proficiency tests, and
finance/accounting / technology / healthcare / law certifications.

## 1. Project purpose

A production-ready, automated directory website for discovering and
cataloguing **exam-prep and professional-certification study communities**
on Telegram, WhatsApp and Discord. The public site's one obvious purpose is:

> Find active exam-prep and professional-certification study communities
> across Discord, Telegram and WhatsApp.

It is **not** a general community directory. It is **not** a messaging
platform and **not** a content farm. Do not target (publicly or in discovery):
gaming, anime, generic jobs, crypto, Forex, trading, coupons, generic AI
communities, generic tech chatter, side hustles, ecommerce, investment
groups, or social/chat groups unrelated to studying. Technology communities
qualify **only** when they are explicitly certification/exam study groups
(e.g. AWS certification study). Built on **real structured information** only.

## 2. Architecture

- **Astro 5** (static site generation), **TypeScript (strict)**, **Tailwind CSS 4**,
  **Node.js 20+**, **JSON data store (V1)**, **GitHub Actions**, **Netlify**,
  **Gemini API** for AI classification/discovery.
- Static HTML everywhere practical. No database required to render content in V1.
- Data access is centralized behind `src/lib/communities.ts`.
- All network-based work lives in scripts (`npm run discover`, `npm run
  validate-links`), never in the build. The production build is deterministic
  and offline.

## 3. Taxonomy (config-first)

- Source of truth: `src/config/exams.ts` (45 configured exams; each has a
  `priority` of `high` | `secondary`) and `src/config/examFamilies.ts`
  (13 families). `src/config/categories.ts` is **derived** from families —
  change config, not templates.
- Slugs are stable. Adding an exam updates queries, classifier keywords, exam
  pages and filters automatically.
- Exam/category assignment is **evidence-based only** — never guessed.

## 4. Data integrity rules (non-negotiable)

1. **Never fabricate data**: community names, invite URLs, member counts, growth
   statistics, ratings, reviews, pass rates, score improvements, founders,
   verification status, descriptions presented as factual, activity dates,
   source URLs, official affiliation, exam categories, target markets.
   If unknown → `null` / `"unknown"` / `[]`, and the UI hides it.
2. **No fake "Verified" badges.** Only these verification states exist:
   `unverified | source-confirmed | owner-confirmed | manually-reviewed`.
   `source-confirmed` requires a real, independent public source with an
   actual outbound `<a href="">` to the **exact normalized invite** (or, for
   alternate Discord invites, the **same guildId**). Search-result snippets
   and search redirects are **not** confirmation. No script ever auto-assigns
   `owner-confirmed` or `manually-reviewed` — those are human editorial
   decisions only. **A working or source-confirmed community link does NOT
   mean every study resource, tutor, exam claim or file inside is verified.**
3. **Member counts only when sourced.** Discord: use the Discord API member
   count only. Telegram: public Telegram evidence only where reliably
   available. Store `memberCount`, `memberCountSource`, `memberCountCheckedAt`
   together or all `null`. `memberCountSource` must point to the actual
   platform evidence source — never attribute a Discord API count to an
   unrelated external website. Never estimate.
4. **No ratings/reviews/growth metrics in V1.** No "trending", "fastest
   growing", "4.9 stars", "top rated". "Featured" is an explicit editorial
   config field only.
5. **Public content only.** The discovery system never joins private groups,
   bypasses login walls/CAPTCHAs/anti-bot protections, scrapes private messages
   or member profiles, impersonates users, creates fake accounts, messages
   admins, or crawls prohibited resources. If a source blocks automation →
   `status = unknown`.
6. **`src/data/groups.json` is the source of truth** for published listings;
   `src/data/pending-groups.json` holds discoveries that need review. Discovery
   results default to `pending`. Publication is manual (`npm run approve --
   <id>`) or via hardened gated auto-approval (`npm run auto-approve`, see
   `scripts/data/autoApprove.ts`). **`AUTO_PUBLISH_DISCOVERED=false` — pending
   records are NOT public.** Auto-approval NEVER sets a verification status
   beyond `unverified`, and NEVER assigns `manually-reviewed`.
7. **ZERO demo/sample content in production — enforced.** `npm run
   validate-data` FAILS the build if any record has `isSample: true`, a
   placeholder invite/source URL, "(Demo)" in the title, or "Demo fixture" in
   the description. Fixtures live only in `tests/`.
8. **Do not rewrite JSON files unnecessarily.** Load → validate → normalize →
   modify → deduplicate → validate again → write atomically (temp + rename).
9. **Do not copy full third-party content.** Use factual metadata and concise
   original summaries based on public evidence. Store original source URLs.

## 5. Description policy

Description priority:
1. platform-extracted factual description
2. confirmed independent-source factual snippet
3. `null`

No Gemini-generated promotional filler. Promotional/marketing language
("join now", "grow your skills", "don't miss out", "boost your") is flagged
(`safetyFlags: ['promotional-description']`) and never published as factual.

## 6. Official affiliation

Never label any community "Official SAT / Official IELTS / Official AWS /
Official CFA / Official CompTIA / Official Cisco / [any brand]" unless an
authoritative official organization explicitly links that **exact** community.
Name similarity is never sufficient. Unofficial claims that mimic official
labels are flagged.

## 7. TypeScript conventions

- Strict mode. Avoid `any` unless genuinely unavoidable (then document it).
- Prefer explicit interfaces; string-literal union types over enums.
- `import type { ... }` for type-only imports (verbatimModuleSyntax).
- No `import.meta.env` outside Astro (`src/`): node scripts (`scripts/`) load
  env via `dotenv/config` and must not import `src/config/site.ts`.
- Scripts and `src/lib` shared modules are pure Node-compatible TS.

## 8. Component conventions

- Components are small, presentational, receive data via props.
- Astro islands/JS only where interaction genuinely requires it (search,
  filters, mobile menu, theme toggle). Directory content is in rendered HTML.
- External links use `rel="noopener noreferrer"`.
- Reusable design tokens in `src/styles/global.css` (`@theme`). Visual style
  stays restrained and professional — a directory, not an ad farm.

## 9. SEO conventions

- Every indexable page gets a unique title + meta description + canonical
  (built from `PUBLIC_SITE_URL`, never a Netlify preview URL) + OG/Twitter.
- Central helpers in `src/lib/seo.ts`; site values in `src/config/site.ts`.
- **Thin-page protection (config in `src/config/discovery.ts`):** exam pages
  with fewer than `EXAM_INDEX_MIN` (5) real published listings → `noindex,
  follow` + sitemap exclusion; category pages < `CATEGORY_INDEX_MIN` (3);
  tag pages < `TAG_PAGE_INDEX_MIN` (5). **Pending records never count toward
  indexability.** `/recently-added/` and `/recently-updated/` are noindex +
  excluded from sitemap.
- The sitemap filter in `astro.config.mjs` computes real published counts from
  `groups.json` — pending, demo, and empty/thin pages never appear.
- **No generic AI articles on empty/thin pages** just to get them indexed.
- Structured data only where semantically appropriate (WebSite, CollectionPage,
  ItemList, BreadcrumbList, WebPage, Organization). **Never** fake Review /
  AggregateRating / Product / Course schema.
- The site has **one** vertical purpose (study-prep). No crypto/forex/jobs/
  deals/gaming/AI content on public pages.

## 10. Discovery architecture

Pipeline: query generation → public search source (Tavily / Brave / Gemini
with Google Search grounding) → candidate URLs → normalization → early
study-intent filter → platform validation → deduplication → Gemini
classification → exam-risk filter → pending (review) or rejected (logged).

- Providers implement `DiscoveryProvider { search(query) }`. Do not build
  unofficial platform exploitation; credential-required adapters stay disabled
  until configured.
- **Discovery strongly favors explicit exam/certification intent.** PRIMARY
  exams (SAT, ACT, GRE, GMAT, IELTS, TOEFL, MCAT, NCLEX, USMLE, LSAT, CFA,
  CPA, AWS, Security+, CCNA, CISSP, PMP) receive the large majority of query
  budget. "General Study Communities" is NOT a major Phase-1 discovery or
  indexing category. It stays config-present but not prioritized.
- Weak terms alone (`students`, `learning`, `education`, `community`, `study`,
  `school`) are never sufficient. Strong intent terms: `exam prep`, `test
  prep`, `study group`, `study community`, `exam preparation`, `certification
  study`, `certification exam`, `practice questions`, `mock exam`, `exam
  candidates`, `test candidates`, or a specific exam name + study/prep.
- Gemini may classify, categorize, tag, summarize evidence and flag risky
  wording. Gemini must **never** invent URLs/member counts/reviews, declare a
  community safe, or endorse it. A real URL must exist as evidence.
- The classifier uses a strict JSON prompt, `maxOutputTokens` cap, one retry,
  JSON salvage and Zod validation. Default model `gemini-3.5-flash-lite`.
- Budget controls in `src/config/discovery.ts` + env overrides; `--dry-run`
  and `--limit` supported. Structured logs, no secrets printed.
- Rejected candidates (wrong-niche, dead, risk, low-confidence) are logged
  with reasons to `src/data/rejected-candidates.json` — they never enter pending.

## 11. Exam-risk safety filter (non-negotiable)

`scripts/safety/examRiskClassifier.ts` — strict rejection (high-risk-reject)
for: **real exam dumps, braindumps, leaked exam, actual exam questions, stolen
questions, paper leak, answer key before exam, proxy test taker, take exam for
you, certificate without exam, pay for certificate, credential fraud,
impersonation.**

Risk-flagged (pending + `safetyFlags: ['exam-risk-language']`) for ambiguous:
guaranteed questions, answer-key/leak talk.

**Never** reject legitimate study support: practice questions, mock exams,
flashcards, official sample tests, peer-created quizzes, study notes.

## 12. Link validation

`npm run validate-links` checks stored destination URLs with per-platform
adapters (see `scripts/validate/`). Cautious transitions only: first failure →
`unknown`; repeated strong 404/invalid evidence → `dead`; manual report →
`reported`. Never guess; bot-blocking must not produce `dead`. Update
`lastCheckedAt` for every check. Respect rate limits and delays.

Platform rules:
- **Telegram: HTTP 200 is NOT evidence.** Personal/contact pages ("Contact @",
  "If you have Telegram, you can contact", "Send Message"), personal user
  pages, and pages missing real public group/channel metadata are rejected →
  `unknown`. `active` requires real channel/group preview structure.
- **Discord:** official invite API (`/api/v10/invites/<code>?with_counts=true`).
  Active requires a legitimate guild result; guild ID, guild name and member
  count are stored only when the API returns them (API URL as source).
- **WhatsApp:** cautious — active only when the join UI clearly renders;
  uncertain → `unknown`. Generic invite HTML is not proof.

## 13. Publishing: pending-first & observation phase

- **`AUTO_PUBLISH_DISCOVERED=false`.** Discoveries always land in pending.
- **7-day observation phase (2026-08-19+):** the daily GitHub Action discovers
  + validates links only — it does **NOT** auto-publish. The
  `auto-approve` step is disabled in `discover-groups.yml`. `npm run
  auto-approve` remains available for manual use but the schedule never runs
  it on its own.
- Gated auto-approval (when owner re-enables) publishes ONLY when **all** hold:
  `linkStatus === 'active'` (never `unknown`) · `lastCheckedAt` exists and is
  recent (≤7 days, configurable) · `vertical === 'study-prep'` · specific
  exam/certification intent confirmed · no exam leak/dump risk · no credential
  fraud risk · no severe safety flag · valid source/evidence requirements ·
  not a duplicate · `published === false`.

## 14. Moderate & hold policy

Reject/flag: malware, phishing, stolen credentials, sexual exploitation,
illegal markets, fraud, impersonation, financial scams, credential dumps,
exam leaks/dumps, proxy test takers. When uncertain → `pending`, never
auto-publish. Generic study / homework / social / accountability groups with
no exam or certification focus are **held or rejected from initial production**
(topical SEO authority). Initial launch inventory = explicit exam-prep and
professional-certification communities only. The goal is 30–50 genuinely
useful, manually reviewed, explicit exam/certification communities — quality
over quantity.

## 15. Commands

```bash
npm install
npm run dev            # local dev server
npm run build          # production build (must pass before any "done" claim)
npm run preview        # serve the production build locally
npm run typecheck      # strict TypeScript check
npm run lint           # eslint
npm run test           # vitest
npm run validate-data  # schema + production guard + rejected-log shape
npm run discover -- --dry-run   # plan only, no writes
npm run discover       # discovery → pending-groups.json
npm run validate-links # link health check (network)
npm run append -- <id> # (manual) move a reviewed pending listing into groups.json
npm run auto-approve   # hardened gated auto-approve (manual; not scheduled in obs phase)
npm run data:stats     # dataset summary
```

## 16. Environment variables

See `.env.example`. Never commit real `.env` files. Secrets go in GitHub
Actions secrets / Netlify environment variables, never in workflow YAML.
Required for discovery only: `GEMINI_API_KEY` (classification). The site
builds and runs without any env vars set. If Brave is configured but no
`BRAVE_API_KEY` exists, discovery skips it gracefully — Brave is never
required.

## 17. GitHub Actions

- `.github/workflows/discover-groups.yml` — daily scheduled discovery
  (04:17 UTC), validates links, **pending-only during observation phase**
  (no auto-publish), commits only real data changes with a bot commit.
- `.github/workflows/validate-groups.yml` — scheduled link health, commits
  meaningful status changes.
- `.github/workflows/quality-check.yml` — typecheck/lint/test/validate-data/
  build on pushes and PRs.

Workflows gracefully handle quota exhaustion, provider errors, transient
network errors, malformed candidates, merge races, empty discoveries and
duplicates. One bad candidate never breaks the run.

## 18. Forms

- `/submit/` and `/report/` use Netlify static forms (`data-netlify="true"`,
  honeypot field, hidden `form-name`). Submissions land in the Netlify Forms
  inbox for manual review — never auto-written to JSON.
- Reports never auto-remove a listing; manual moderation is authoritative.
- Admin contact from forms stays private; never place emails in static JSON.

## 19. Testing

Tests live in `tests/` (vitest) and target critical pure functions: URL
normalization, deduplication, slug behavior, schema validation, filters,
exam/taxonomy matching, study-relevance, exam-risk, affiliation guard,
description policy, funnel metrics, related-community selection. No
superficial HTML-text tests. Before declaring completion, run the full
quality suite
(`npm run typecheck && npm run lint && npm run test && npm run validate-data && npm run build`)
and fix every failure.

## 20. Deployment & domain

Netlify: build command `npm run build`, publish directory `dist`, set
`PUBLIC_SITE_URL`. **Do NOT migrate the domain during the stability phase.**
Keep the temporary Netlify production URL. Do not change canonicals to an
imaginary future domain. **Do NOT submit to Google Search Console until** the
final custom domain is selected and initial quality inventory exists.
Full instructions in `README.md`.