# StudyScout

**Find active exam-prep and professional-certification study groups across Discord, Telegram and WhatsApp.**

StudyScout is an automated, statically generated directory of public study
communities for entrance exams, admissions tests, professional licensing
exams, English proficiency tests, finance/accounting certifications, and
technology/security/cloud/networking certifications.

Built with Astro + TypeScript + Tailwind CSS, deployed on Netlify, powered by
a free-tier discovery engine (Tavily/Brave search + Gemini classification)
with strict quality gates, cautious link validation, and a pending-first
review workflow.

## Project purpose

> This project is an exam-preparation and professional-certification
> community directory. Do not reintroduce unrelated general-community niches
> without explicit owner approval. — AGENTS.md

## Exam taxonomy

- 13 exam families (`src/config/examFamilies.ts`): College Admissions,
  Graduate Admissions, English Proficiency, Medical & Healthcare, Law,
  Finance & Accounting, Technology, Cybersecurity, Cloud, Networking,
  Project Management, Professional Licensing, General Study.
- 45 exams (`src/config/exams.ts`): SAT, ACT, AP Exams, PSAT, GRE, GMAT,
  IELTS, TOEFL, PTE, Cambridge English, OET, MCAT, USMLE, NCLEX, UCAT, PLAB,
  LSAT, Bar Exam, SQE, CFA, CPA, ACCA, FRM, CIMA, CMA, AWS, Azure, Google
  Cloud, Security+, A+, CISSP, CEH, OSCP, CySA+, PenTest+, CCNA, CCNP,
  Network+, PMP, CAPM, PRINCE2, Scrum PSM, CSM, and more.
- Every record carries `vertical: "study-prep"`; production validation
  REJECTS published records from any other vertical.

## Data model

See `src/types/community.ts` and `src/lib/schema.ts`. Key fields:

- `vertical: 'study-prep'`
- `category` = primary exam family
- `examFamilies`, `exams` — evidence-based only (never guessed)
- `targetMarkets` — `US | UK | CA | AU | NZ | IE | global-english`
- `certificationProvider`, `examLevel` — only when evidenced
- `studyTypes` — discussion, study-group, practice-questions, accountability,
  resources, exam-strategy, peer-support
- Plus the existing integrity fields: `linkStatus`, `verificationStatus`,
  `sourceUrls`, `memberCount` (only when sourced), `discordGuildId` (dedupe).

## Discovery pipeline

```
Tavily / Brave / (Gemini search grounding)
        ↓  real candidate URLs only
normalize (platform rules, t.me/s canonicalization)
        ↓
platform-specific validation (Discord invite API, Telegram preview, cautious WhatsApp)
        ↓
study relevance filter (explicit exam-prep/study focus required)
        ↓
Gemini classification (zero-guess, evidence-based)
        ↓
exam-risk classifier (leaked dumps / proxy test takers / credential fraud → REJECT)
        ↓
deduplication (URL, Telegram handle, Discord guild ID, titles)
        ↓
pending-groups.json (published=false — ALWAYS review first)
```

- `AUTO_PUBLISH_DISCOVERED=false` — nothing is ever published without gates.
- The daily GitHub Action (04:17 UTC) runs discover → validate-links →
  gated auto-approve → commit → Netlify auto-deploy. Auto-approve requires:
  link `active` + fresh check + independent source + no safety flags +
  classified + no scam indicators + production guard clean, capped at 30/day.
- Rejected candidates (wrong niche, dead, risk) land in
  `src/data/rejected-candidates.json` with reasons.

## Commands

```bash
npm install
npm run dev               # local dev server (default http://localhost:4321)
npm run build             # production build → dist/
npm run typecheck         # TypeScript strict check
npm run lint              # ESLint
npm run test              # vitest (93+ tests)
npm run validate-data     # schema + production guard + dataset invariants
npm run data:stats        # dataset summary
npm run discover -- --dry-run          # discovery plan (no writes)
npm run discover                        # live discovery → pending
npm run validate-links                  # link health checks (official APIs)
npm run auto-approve                    # gated auto-publish of pending
npm run approve -- <candidate-id>       # manual approve of a held candidate
```

## Environment variables

See `.env.example`. Key variables:

| Variable | Purpose |
|---|---|
| `PUBLIC_SITE_URL` | Canonical site URL (Netlify: `https://groupscout.netlify.app`) |
| `TAVILY_API_KEY` | Free-tier web search (1,000 credits/mo) — recommended |
| `BRAVE_API_KEY` | Alternative free search provider |
| `GEMINI_API_KEY` | Classification (free tier works; search grounding usually needs paid) |
| `GEMINI_MODEL` | Default `gemini-3.5-flash-lite` |
| `DISCOVERY_MAX_SEARCH_QUERIES` | Distinct query topics per run (default 25) |
| `DISCOVERY_MAX_PROVIDER_REQUESTS` | Total search-API calls per run (default 75) |
| `AUTO_APPROVE_MAX` | Max auto-published per run (default 30) |
| `AUTO_PUBLISH_DISCOVERED` | Keep `false` |

Secrets are never committed. GitHub Actions reads them from repository secrets
(`TAVILY_API_KEY`, `BRAVE_API_KEY`, `GEMINI_API_KEY`).

## Validation & safety

- **Active ≠ verified.** A working link only proves reachability.
- **Never fabricated:** member counts, pass rates, score improvements,
  reviews, verification status, official affiliation, exam categories.
- Exam-risk classifier (`scripts/safety/examRiskClassifier.ts`) rejects
  leaked-exam/dump/braindump/proxy-test-taker/credential-fraud groups and
  flags ambiguous risk language for human review. Legitimate practice
  questions, mock exams, flashcards and study notes are NOT flagged.
- Source-confirmed requires an independent page that links the exact invite.

## Deployment

1. GitHub repo: `jibranpcccc/groupscout` (auto-deploy workflow on push).
2. Netlify site: `groupscout.netlify.app` (same project as the pre-conversion site).
3. Deploy manually: `npm run build && npx netlify deploy --prod --dir=dist`.

## SEO & indexing

- Unique titles/descriptions/canonicals per page; OG/Twitter tags; JSON-LD
  (WebSite, Organization, CollectionPage, ItemList, BreadcrumbList).
- Indexation thresholds (centralized in `src/config/discovery.ts`):
  exam pages index at ≥5 real listings, categories at ≥3, tags at ≥5.
  Below that: `noindex,follow` + sitemap exclusion.
- Sitemap only contains indexable production URLs — no thin pages, no
  form/utility pages, no old-niche pages.

## Removing/changing content

- Manage listings in `src/data/groups.json` (published) and
  `src/data/pending-groups.json` (review queue).
- Old pre-conversion data is archived under `archive/pre-study-conversion/`.
- Run `npm run validate-data` after any manual edit — it fails the build on
  schema violations, demo markers, or non-study-prep published records.