# Conversion Status — GroupScout → StudyScout (handoff for review)

**Repo:** `C:\HermesWork\community-directory` · **Branch:** `main` · **Date:** 2026-08-19
**Live during conversion:** https://groupscout.netlify.app (serving the PRE-conversion site until deploy)

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