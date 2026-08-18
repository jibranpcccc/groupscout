# GroupScout

An automated, production-ready directory website for discovering and cataloguing
**public online communities** on Telegram, WhatsApp and Discord — with an
architecture ready for more platforms (Reddit, Slack, Facebook Groups, Skool,
GitHub Discussions, public forums) later.

> **Core principle:** the product is built on **real structured information**,
> never mass-generated fake SEO content. Member counts, ratings, "trending"
> numbers and "verified" badges are only shown when real evidence exists.

---

## What this project is

- A searchable, filterable, categorized directory of publicly discoverable communities.
- Static-generated pages (Astro SSG) — no database required to serve content in V1.
- An automated discovery pipeline (Gemini with Google Search grounding) that
  finds candidate public invite URLs and routes them to a **pending review**
  queue — discovery is not publication.
- A cautious link-health engine that checks stored URLs without ever joining
  groups or scraping private data.
- GitHub Actions for scheduled discovery, link validation and CI quality gates.
- Netlify-ready deployment with forms, headers and redirects configured.

## Stack

| Layer | Choice |
|---|---|
| Framework | Astro 5 (static site generation) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| Data store | JSON (`src/data/*.json`) via a centralized repository layer |
| Schema validation | Zod |
| AI classification/discovery | Gemini API (`@google/genai`) with Google Search grounding |
| Tests | Vitest |
| CI/CD | GitHub Actions + Netlify |

## Local installation

```bash
git clone <your-repo-url>
cd community-directory
npm install
npm run dev
```

Open http://localhost:4321. The site runs fully **without any API keys**.

## Environment variables

Copy `.env.example` to `.env` for local discovery work. Only `GEMINI_API_KEY`
is needed, and only for `npm run discover` — the website builds without it.

| Variable | Purpose | Default |
|---|---|---|
| `PUBLIC_SITE_URL` | Canonical URLs, sitemap, robots.txt | `http://localhost:4321` |
| `GEMINI_API_KEY` | Discovery/classification (optional) | — |
| `GEMINI_MODEL` | Gemini model for discovery | `gemini-2.5-flash` |
| `GEMINI_SEARCH_ENABLED` | Google Search grounding toggle | `true` |
| `DISCOVERY_MAX_QUERIES` | Query budget per run | `30` |
| `DISCOVERY_MAX_CANDIDATES` | New-candidate cap per run | `100` |
| `AUTO_PUBLISH_DISCOVERED` | Publish straight to groups.json | `false` |
| `VALIDATE_DELAY_MS` | Delay between link checks | `1500` |
| `VALIDATE_MAX_CHECKS` | Max links checked per run | `200` |
| `SHOW_AD_PLACEHOLDERS` | Render non-functional ad boxes | `false` |

## Data structure

- `src/data/groups.json` — the **production content source** (published listings).
- `src/data/pending-groups.json` — discoveries/submissions awaiting human review.
- `src/data/seeds.json` — manual seed URLs usable without Gemini.
- `src/types/community.ts` — the strongly typed community model.
- `src/lib/schema.ts` — Zod runtime validation; the build fails on malformed data.

Every listing records: platform, category, tags, invite URL, description,
verification status (`unverified | source-confirmed | owner-confirmed |
manually-reviewed`), link status (`active | unknown | dead | removed |
reported`), source URLs, discovery method/date, and (only when sourced) member
counts. Missing information is `null`/`unknown` and the UI hides it — nothing
is ever invented.

## Adding a community manually

1. Open `src/data/groups.json`.
2. Copy an existing record as a template and fill it in with **real facts**:
   - `id`/`slug`: lowercase, permanent (never change after publication).
   - `inviteUrl`: the real public invite link.
   - `sourceUrls`: where the listing was publicly identified.
   - `memberCount` fields: only with a real source; otherwise keep `null`.
3. Run `npm run validate-data` to confirm the record is valid.
4. Commit — Netlify rebuilds automatically.

## Running discovery

```bash
npm run discover -- --dry-run   # plan only — prints what would be added, writes nothing
npm run discover                # live run (requires GEMINI_API_KEY)
npm run discover -- --limit 5   # cap new candidates
npm run discover -- --seeds ./my-seeds.json
```

The pipeline: query generation → Google-search-grounded Gemini → candidate
URLs → normalization → deduplication → validation → Gemini classification →
confidence checks → **pending-groups.json** (default) or groups.json (only
with `AUTO_PUBLISH_DISCOVERED=true`, which you should keep off until the
pipeline proves reliable).

Only real URLs from search grounding count as evidence — Gemini's prose is
never treated as a source.

## Reviewing pending discoveries

```bash
npm run data:stats              # see pending count
npm run approve -- <candidate-id>   # publish one pending record
```

or edit `src/data/pending-groups.json` manually (set `published: true` and
move the record into `groups.json`). Every write path validates the schema
first and writes atomically.

## Validating links

```bash
npm run validate-links
```

Checks stored invite URLs via per-platform adapters (public signals only —
never joining groups). Transitions are cautious: a single failure → `unknown`,
repeated strong 404s → `dead`, bot-blocking is never treated as death. Every
check stamps `lastCheckedAt`.

## GitHub Actions

| Workflow | Schedule | What it does |
|---|---|---|
| `discover-groups.yml` | daily 04:17 UTC + manual | discovery → validate → commit real changes |
| `validate-groups.yml` | Mon/Thu 06:23 UTC + manual | link health → validate → commit status changes |
| `quality-check.yml` | push/PR to main | typecheck, lint, test, validate-data, build |

Workflows tolerate quota exhaustion, Gemini errors, transient network errors,
empty discoveries and duplicates — one bad candidate never breaks a run. Only
actual data changes are committed, by a bot identity, and secrets are never
committed.

## Netlify deployment

1. Push this repository to GitHub.
2. In Netlify: **Add new site → Import an existing project → pick the repo**.
3. Netlify reads `netlify.toml`: build command `npm run build`, publish
   directory `dist` — no manual config needed.
4. In **Site settings → Environment variables**, set:
   - `PUBLIC_SITE_URL` = your production domain (e.g. `https://example.com`)
   - (optional) `SHOW_AD_PLACEHOLDERS` if you want placeholder ad boxes
5. Deploy. The first build is deterministic and needs no secrets.

## Netlify Forms

- `/submit/` (community submissions), `/report/` (listing reports) and
  `/contact/` use Netlify static forms with honeypot spam protection.
- Submissions land in **Netlify → Forms** for manual review. They are **not**
  automatically written to the JSON dataset.
- Review flow: read the submission → verify the invite URL → add the approved
  record to `src/data/groups.json` (or `npm run approve -- <id>` for
  discoveries) → commit → Netlify rebuilds.

## Gemini configuration

1. Create a key at https://aistudio.google.com/apikey.
2. Local: put it in `.env` (`GEMINI_API_KEY=...`).
3. GitHub Actions: add it as a **repository secret** named `GEMINI_API_KEY`
   (Settings → Secrets and variables → Actions). Never put secrets in YAML.
4. Netlify: only needed if you run discovery there; the scheduled discovery
   runs in GitHub Actions instead.

### Free-tier notes (important)

- **Search grounding** (Google Search via `googleSearch` tool) is typically
  **quota-blocked on free-tier keys** (429 RESOURCE_EXHAUSTED). The pipeline
  handles this gracefully: grounding queries fail individually, the run
  continues, and nothing crashes.
- **Classification works on the free tier.** Seeds + classification is the
  full free-tier discovery path: `npm run discover` reads `src/data/seeds.json`
  (real public URLs you add yourself), Gemini classifies each one, and results
  land in `pending-groups.json` for review — no grounding required.
- The default model `gemini-3.5-flash-lite` is the most reliable free-tier
  choice for structured output. Some flash models produce truncated or
  repetitive JSON when given a `responseSchema`; this project intentionally
  uses a strict JSON prompt + bounded output tokens + retry + Zod validation
  instead, which tests showed to be dependable.

## Removing sample data

`src/data/groups.json` contains **demo fixtures** (every record has
`"isSample": true` and uses `example.com` invite URLs). Before production:

1. Run `npm run data:stats` to see the dataset.
2. Remove every record with `"isSample": true` from `groups.json` and
   `pending-groups.json` (the only pending record is a sample).
3. Run `npm run validate-data` and `npm run build`.
4. Consider replacing `seeds.json` with your real seed URLs (or `[]`).

Never ship the demo fixtures as real listings — they are clearly fictional.

## Production checklist

- [ ] Remove all `isSample` records
- [ ] Set `PUBLIC_SITE_URL` in Netlify
- [ ] Add `GEMINI_API_KEY` to GitHub secrets
- [ ] Add your real seed URLs to `seeds.json`
- [ ] Review `/privacy`, `/terms`, `/disclaimer` copy with a lawyer
- [ ] Replace `public/favicon.svg` + `public/images/og-default.svg` with your brand
- [ ] Edit `src/config/site.ts` for your site name
- [ ] Test Netlify Forms (submit + report) on the live site
- [ ] Confirm `npm run validate-data` and `npm run build` pass in CI

## GitHub setup

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create community-directory --private --source=. --push
```

Then add the repository secret:

```
Name:  GEMINI_API_KEY
Value: <your Gemini API key>
```

## Future database migration

```
JSON (V1)
  ↓
repository layer (src/lib/communities.ts — already centralized)
  ↓
Supabase/PostgreSQL
```

The UI never reads data files directly; a future migration re-implements
`src/lib/communities.ts` against a database and nothing else changes.

## Known V1 limitations

- **WhatsApp:** discovery is limited to publicly indexed `chat.whatsapp.com`
  URLs; not every public group is globally discoverable.
- **Discord:** only publicly discoverable invite links from permitted sources;
  we never enumerate servers.
- **Telegram:** public URLs found via public search; we never join groups.
- **Member counts:** only shown when a real source provides them.
- **Ratings:** not implemented (no review system exists — by design).
- **Verification:** directory discovery is not verification. See
  `/how-we-verify/`.

## Commands summary

```bash
npm run dev              # dev server
npm run build            # production build
npm run preview          # serve the built site
npm run typecheck        # astro check + tsc --noEmit
npm run lint             # eslint
npm run test             # vitest
npm run validate-data    # schema + duplicate validation
npm run discover         # Gemini discovery → pending queue
npm run validate-links   # link health checks
npm run data:stats       # dataset summary
npm run approve -- <id>  # publish a pending record
```
