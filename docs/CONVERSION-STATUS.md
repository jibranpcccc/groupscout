# Conversion Status — GroupScout → StudyScout (handoff for review)

**Repo:** `C:\HermesWork\community-directory` · **Branch:** `main` · **Date:** 2026-08-19
**Live:** https://groupscout.netlify.app (converted site deployed, commit `ab91c58`)

## ✅ COMPLETE — converted, deployed, verified live (2026-08-19)

All sections from the previous draft are DONE: archive, dataset reset, taxonomy
(13 families / 45 exams), types/schema/vertical guard, brand (StudyScout),
trust pages + forms, tests (93 passing), crawler + exam-risk engine, public
pages incl. 45 exam routes, sitemap/robots/noindex, clean build (78 pages,
zero old-niche hits in dist and on the live site), small discovery test run
(9 real study communities in pending, 71 wrong-niche rejected with reasons),
deployed, live-verified.

**Pending (owner action):**
- AGENTS.md rewrite was blocked by the protected-file approval prompt timing
  out (user away). The file still contains pre-conversion references — approve
  the rewrite when convenient (I have it drafted) or have the review agent
  note it.
- Review the 9 pending study communities (`npm run approve -- <id>` or
  `npm run auto-approve` for gated batch).
- Google Search Console: not submitted (per audit instructions).

## 1. Migration

- Old published records archived: 22 → `archive/pre-study-conversion/groups-before-study-niche.json`
- Old pending archived; datasets reset to empty; seeds reset to empty.
- Old category/discovery/site configs archived under the same folder.

## 2. Build

- typecheck: PASS (0 errors) · lint: PASS · tests: 93/93 PASS
- validate-data: PASS (schema + production guard + rejected-log shape)
- build: PASS (78 pages; 45 exam pages; 0 old-niche terms in dist)

## 3. New taxonomy

- Exam families: 13 · Enabled exams: 45 (18 high-priority) · Platforms: Discord, Telegram, WhatsApp
- Target markets: US, UK, CA, AU, NZ, IE, global-english (evidence-based)

## 4. Discovery (first small test — real run)

- Query topics: 15 (one per exam/family) · Provider requests: Tavily + Gemini
- Raw candidates: 86 → normalized 73 → wrong-niche rejected 71 · risk-rejected 0
- Duplicates 0 · Active after link validation: 3 (Discord API) · Pending: 9
- Rejected log: 71 entries with reasons (`src/data/rejected-candidates.json`)
- Gemini enabled: yes (classification) · Tavily: yes · Brave: adapter ready
- Daily schedule: 04:17 UTC · Auto publish: FALSE (gated auto-approve available)

## 5. Dataset

- Published: 0 (fresh start — intentional) · Pending: 9 real study communities
- Discord: 3 active · Telegram: 4 unknown (preview-blocked, honest) · WhatsApp: 2 unknown

## 6. SEO (verified live)

- Homepage title: `StudyScout` (siteConfig.name) · Canonical: https://groupscout.netlify.app/
- robots.txt → sitemap-index.xml (production) · Sitemap: 13 URLs, zero thin exam/category pages, zero localhost
- Empty exam pages: noindex,follow ✓ · Old /category/crypto-web3/: 404 ✓
- Live old-niche scan: 0 hits across 8 key pages ✓

## 7. Production

- Git branch: main · Commit SHA: `ab91c58e3a439b9e0c436fef7d33681e74795b8c`
- Netlify Site ID: d0979188-a441-489b-b61a-86d9d770ce9b · Production URL: https://groupscout.netlify.app

## 1. What this conversion is

Full niche conversion from a general community directory to a focused
directory of **exam-prep & professional-certification study groups** on
Discord, Telegram and WhatsApp. Driven by the MASTER CONVERSION INSTRUCTION
(140 requirements). The directory engine (Astro/TS/Tailwind/JSON/GitHub
Actions/Netlify/Gemini+Tavily discovery/link validation) is preserved; the
taxonomy, content, crawler, risk engine, forms and SEO are being replaced.

## 2. Status of each layer (measured 2026-08-19)

| Layer | Status | Notes |
|---|---|---|
| Archive of old data/config | ✅ DONE | `archive/pre-study-conversion/` (groups, pending, seeds, categories, discovery, site config) |
| Production dataset reset | ✅ DONE | groups/pending/seeds = `[]` |
| Exam taxonomy | ✅ DONE | `src/config/examFamilies.ts` (13 families), `src/config/exams.ts` (45 exams, 18 high-priority) |
| Types + schema | ✅ DONE | `vertical:'study-prep'` required; new fields (examFamilies, exams, targetMarkets, certificationProvider, studyTypes, examLevel) |
| Niche build guard | ✅ DONE | `findProductionViolations` rejects published records with `vertical !== 'study-prep'`; unit-tested |
| Brand | ✅ DONE | `siteConfig.name='StudyScout'` (centralized), OG image updated; routes don't depend on brand |
| Trust pages + forms (11 files) | ✅ DONE | safety, how-we-verify, editorial-policy, disclaimer, about, privacy, terms, submit, report, 2 success pages — study niche |
| Tests | 🟡 88/93 passing | 5 failures: dedupe contract (platform missing on fixture), exam-risk rules ×2, query-interleaving coverage, study-relevance wrong-niche — being fixed in integration |
| Discovery crawler + exam risk engine | 🟡 files present, unverified | `scripts/safety/examRiskClassifier.ts`, rewritten `generateQueries.ts` + classifier live; agent hit iteration cap — must be verified end-to-end |
| **Public pages (homepage, /exam/[slug]/ routes, nav, group-page study fields, sitemap filter)** | 🔴 **MISSING** | Agent assigned to this layer hit its iteration cap — `src/pages/exam/` does not exist; homepage/nav/group pages not converted. Largest remaining gap — being implemented by the integrator. |
| README + AGENTS.md rewrite | ⏳ pending | Intentionally after integration so docs reflect the shipped state |
| Clean build + dist old-niche audit | ⏳ pending | Required before deploy |
| Small discovery test (first batch inspection) | ⏳ pending | Required before any real data can enter pending |
| Deploy + live verification (SEO, sitemap, robots, pages) | ⏳ pending | Same Netlify site `groupscout.netlify.app` |
| Final evidence report (per spec §139) | ⏳ pending | |

## 3. Key contracts already in place (write code/tests against these)

- `src/config/exams.ts`: `ExamConfig {slug,name,family,description,keywords,queryMarkets?,priority,queryModifiers}`, exports `exams`, `getExam(slug)`, `getExamName(slug)`, `getExamsByPriority()`.
- `src/config/examFamilies.ts`: `ExamFamilyConfig {slug,name,description,exams,tags}`, exports `examFamilies`, `getExamFamily(slug)`, `getExamFamilyName(slug)`.
- `src/config/categories.ts`: rebuilt FROM families; same API as before (`categories`, `getCategoryBySlug`, `isCategorySlug`, `getCategoryName`, `getAllTags`, `slugifyTag`, `assertTagSlugsUnique`, `requiresFinancialDisclaimer` (always false — study notice replaces it)).
- `src/types/community.ts`: `vertical:'study-prep'`, `examFamilies:string[]`, `exams:string[]`, `targetMarkets:TargetMarket[]` (`US|UK|CA|AU|NZ|IE|global-english`), `certificationProvider?`, `studyTypes:StudyType[]` (`discussion|study-group|practice-questions|accountability|resources|exam-strategy|peer-support`), `examLevel?`.
- `src/lib/schema.ts`: `vertical: z.literal('study-prep')` (required), new fields validated; `findProductionViolations` adds `wrong-vertical` for published non-study-prep records.
- Indexation thresholds in `src/config/discovery.ts`: `EXAM_INDEX_MIN=5`, `CATEGORY_INDEX_MIN=3`, `TAG_PAGE_INDEX_MIN=5`, `PAGE_SIZE=24`.
- Review-layer changes already shipped earlier (pre-conversion audit): auto-approve publishes ONLY `active` + fresh `lastCheckedAt` + independent source; balanced interleaved queries; Discord guild-ID dedupe; production guard; netlify.toml security headers; noindex/sitemap controls.

## 4. Rules a reviewer must check (highest value first)

1. No old-niche public content anywhere (Crypto/Forex/Jobs/Deals/Gaming/Web3/AI-community language) — grep `dist/` after build, expect ZERO.
2. `vertical:'study-prep'` guard actually fails the build on old-niche records.
3. Exam-risk engine: leaked-dumps/proxy-testing/fake-certificate groups REJECTED, practice-question groups ACCEPTED (not over-flagged).
4. Auto-publish stays disabled (`AUTO_PUBLISH_DISCOVERED=false`); pending-first workflow intact.
5. Query generation: tiered (high 70% / secondary 20% / experimental 10%), round-robin across exams AND platforms, per-exam caps.
6. `/exam/` pages: generated from config, noindex when <5 real listings, excluded from sitemap when thin.
7. No fake claims: no invented member counts, pass rates, verification, official affiliation, exam categories without evidence.
8. All gates: `npm run typecheck / lint / test / validate-data / build` PASS; squashed-build has zero old-niche hits.

## 5. Environment

Node 24, npm 10, ESM. Run scripts via `npx tsx`. Windows bash (git-bash). Netlify CLI authed (token in `%APPDATA%\netlify\Config\config.json`), site ID `d0979188-a441-489b-b61a-86d9d770ce9b`. GitHub `jibranpcccc/groupscout` with workflows (deploy-netlify + discover + validate + quality-check). Tavily key in GitHub secrets + local `.env`; Gemini key in `.env` (both gitignored).