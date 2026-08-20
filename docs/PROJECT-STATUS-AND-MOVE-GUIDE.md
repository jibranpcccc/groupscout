# StudyScout — What's Done, What Remains, and How to Move the Project

**Project:** StudyScout — exam-prep & professional-certification community directory
**Repo:** `C:\HermesWork\community-directory` (current location)
**Live site:** https://groupscout.netlify.app
**GitHub:** https://github.com/jibranpcccc/groupscout (branch `main`; auto-deploys to Netlify)
**Audit completion commit:** `8526627`
**Date of this document:** 2026-08-20

---

## 2026-08-20 Update

### ✅ Fixed: discover workflow was broken since conversion
The daily discover workflow (`discover-groups.yml`) was **silently dead** since the observation-phase commit: an invalid `${{ env.RUN_START }}` reference in the job-level `env:` block caused GitHub's parser to reject every push (0s failure) and the daily cron (`17 4 * * *`) to never fire — the `env` context is not valid at parse time in that position. Fixed by removing the two env lines (`RUN_START`, `AUTO_APPROVE_SINCE`). Verified: manual dispatch ran end-to-end (run 32357514756), producing 5 new pending candidates, 2 surviving hold-non-active.

### ✅ Fixed: telemetry test pollution
`tests/funnel-metrics.test.ts` was writing test data (`q`/`x`/`y` rows) directly into the real production telemetry logs at `audit/telemetry/*.jsonl` — the `HERMES_TELEMETRY_DIR` env var was never set in the test despite the comment claiming it was. Fixed: tests now use `vi.resetModules()` + dynamic import with a throwaway temp dir. Polluted artifacts (5 query + 5 provider rows) were cleaned. All 222 tests pass.

### ✅ Fixed: pre-existing typecheck error in observation-report test
`tests/observation-report.test.ts:44` had a direct `globalThis as Record<...>` cast that TypeScript rejected (missing `unknown` intermediate). Fixed with `as unknown as { __obsPaths: ... }`. Now `tsc --noEmit` passes clean.

### ✅ New: Tavily 26-key rotation pool
The Tavily discovery provider now supports a **26-key rotation pool** via `TAVILY_API_KEYS` (comma-separated env var), with round-robin distribution and **429 failover**: if a key returns rate-limited, the provider automatically retries with the next key before giving up. Also supports legacy `TAVILY_API_KEY` (single) and `TAVILY_API_KEY_1..N` (numbered). The GitHub secret `TAVILY_API_KEYS` is set with all 26 keys; the workflow passes it as an env var. Verified live: pool loads, search returns results.

### ⚠️ Open: Gemini API quota
The `GEMINI_API_KEY` was added to repo secrets, but the first CI run got HTTP 429 on every Gemini call (`RESOURCE_EXHAUSTED`). The key works locally (all 3 model variants respond). The issue is likely a transient free-tier quota limit (RPM/RPD) — the key works now. The provider has `continue-on-error: true`, so the pipeline doesn't fail, but classification quality degrades when Gemini is unavailable. Fix: (a) re-run the workflow later when quota resets, (b) or generate a fresh key at aistudio.google.com.

### Data state (post-Aug-20 run)
- **Pending: 2** — Admission Hackers [SAT Prep] (discord, 13,993 members, active) + crackd - sat & act prep (discord, 28,517 members, active)
- **Held: 15** — 12 with unknown links (10 Telegram, 2 Discord — unverifiable from this network), 1 dead, 2 active-but-generic (non-exam study)
- **Published: 0** — auto-publish still disabled for observation phase
- **Rejected candidates: 178** (all wrong-niche — 96/101 in today's run; query quality improvement is a recommendation below)

---

## PART 1 — What is DONE (post-conversion integrity audit, all 36 items)

### A. Safety / process hardening
| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | AGENTS.md rewritten to study-prep constitution | ✅ | `AGENTS.md` opens with mandatory niche statement + strict rules |
| 16 | Daily workflow auto-approve **disabled** | ✅ | `discover-groups.yml` auto-approve step commented out (L93-94) |
| 17 | `autoApprove` hardened: `vertical === 'study-prep'` | ✅ | `scripts/data/autoApprove.ts` |
| 18 | `autoApprove` hardened: exam-intent + 7-day freshness (`AUTO_APPROVE_FRESHNESS_HOURS=168`) | ✅ | `scripts/data/autoApprove.ts`, `.env.example` |
| 4 | **Pending queue = active-only enforced in pipeline** | ✅ | `scripts/data/holdNonActive.ts` wired into workflow after link validation; live-verified |
| 2 | Funnel math made **sequential** (each OUT = prior IN − dropped) | ✅ | `scripts/audit/funnel.ts` (`computeFunnel` + `validateFunnel`) |
| 6–10 | Discovery narrowed to 17 primary exams (~85% budget), weak terms removed | ✅ | `scripts/discover/generateQueries.ts` |
| 11 | `examRiskClassifier` full reject/flag/clean matrix | ✅ | `scripts/safety/examRiskClassifier.ts` (42 cases) |
| 12 | Official-affiliation guard (flags fake "Official SAT/AWS/CFA") | ✅ | `scripts/safety/affiliationGuard.ts` (28 tests) |
| 13 | Description-policy guard (promotional/copy-filler) | ✅ | `scripts/safety/descriptionPolicy.ts` (14 tests) |
| 14 | Member-count-source must be platform evidence (not external sites) | ✅ | `src/types/schema.ts` |
| 15 | Schema member-count-source test fixed | ✅ | `tests/schema.test.ts` |
| 19 | Pending re-audited + split: only 1 active niche-clean kept | ✅ | `pending-groups.json` = 1 record |
| 20 | Per-exam/category/thin pages `noindex` | ✅ | `astro.config.mjs` index thresholds + page meta |
| 21 | Sitemap filtered (no empty pages) | ✅ | `astro.config.mjs` `TAG_PAGE_INDEX_MIN` etc. |
| 22 | Live sitemap audit (13 URLs, no empty/old-niche) | ✅ | verified `https://groupscout.netlify.app/sitemap-0.xml` |
| 23 | Live old-niche scan (13 pages, 0 hits) | ✅ | verified |
| 24–25 | Observation-phase rules locked (no redesign, no publish, pending-only) | ✅ | `AGENTS.md` + workflow |
| 26–30 | Per-query + per-provider telemetry JSONL + daily report format | ✅ | `scripts/audit/telemetry.ts`, `audit/telemetry/*.jsonl` |
| 31 | **7-day observation yield metrics (A–J)** | ✅ | `scripts/audit/observationReport.ts` + `npm run observation-report` |
| 32 | Single pending record held for **explicit owner approval** | ✅ | not published; approve command documented |
| 33 | Domain unchanged (still `groupscout.netlify.app`) | ✅ | per instruction |
| 34 | Google Search Console **not** submitted | ✅ | waiting for final domain + inventory |
| 35 | Full CI gates pass | ✅ | typecheck/lint/tests/validate-data/build |
| 36 | This verified audit report | ✅ | `docs/POST-CONVERSION-INTEGRITY-AUDIT.md` |

### B. Live verification snapshot
- **Build gates:** typecheck PASS · lint PASS · **tests 222/222** · validate-data PASS · build 78 pages
- **Live data:** published = 0 · pending = 2 (Admission Hackers [SAT Prep], crackd - sat & act prep — both discord, active) · held = 15 · rejected = 178
- **Live site:** homepage HTTP 200, SAT exam page `noindex`, 13 sitemap URLs, 0 old-niche hits

---

## PART 2 — What REMAINS (not done by the audit)

These are intentionally deferred; none block the observation phase.

| Item | What's left | Why / How |
|------|-------------|-----------|
| **Telegram link verification** | 6 Telegram records are `unknown` (not confirmed active) | This sandbox has **no network to `t.me`**. Run `npm run validate-links` from a networked environment to confirm/reject them. |
| **Publish the 1 pending record** | Admission Hackers not yet public | Explicit owner approval required (items #4, #19, #32). Commands below. |
| **Domain migration** | Still on `groupscout.netlify.app` | Per instruction — not done. When ready: set custom domain + canonical env var in Netlify UI. |
| **Google Search Console** | Not submitted | Per instruction — wait for final domain + listing inventory. |
| **7-day observation window** | Just started | Daily workflow accumulates telemetry; review `npm run observation-report` after 7 days, then decide on publishing criteria. |
| **Per-run funnel telemetry** | Wired (`audit/telemetry/*.jsonl`) but only 1 bootstrap run so far | Will accumulate with each daily run. |
| **Generic-study holding rule nuance** | `holdNonActive` holds `category==='general-study'` OR matched-title records | Works; may need tuning of the title regex as real data arrives. |

---

## PART 3 — How to MOVE the project to a new location

### 3.1 What I actually checked (so you don't miss anything)

I grepped the repo for move-breakage. Findings:

- ✅ **No hardcoded absolute paths in source** (`grep` for `C:\HermesWork` / `/c/HermesWork` in `.ts/.mjs/.json/.yml` → none). Paths use `import.meta.url` / relative, so the project is **location-independent**.
- ✅ **No per-repo git hooks** (only a global `post-commit` that throws a harmless "Exec format error" — it does not block commits/pushes).
- ✅ **No tsconfig path aliases** to rewrite.
- ✅ **Workflow runs on GitHub cron** (`17 4 * * *`), not on this machine — moving the folder does **not** stop daily discovery.
- ✅ **`package-lock.json` present** — `npm ci` will work after the move.
- ⚠️ **`.netlify/netlify.toml` contains a hardcoded `publish = "C:\HermesWork\community-directory\dist"`** (this is the *cached* Netlify CLI config, gitignored). The committed `netlify.toml` is fine (relative `dist`). After moving, delete `.netlify/` so it regenerates — otherwise `netlify dev`/CLI will point at the old path.
- ⚠️ **`.env` is gitignored (324 bytes, contains live API keys).** A `git clone` will **NOT** bring it. Copy it manually or re-create from `.env.example`.

### 3.2 Recommended move method (preserves everything)

Use **git** for code + **manual copy** for secrets. Do NOT rely on a plain file-copy of `node_modules` (slow, can break).

```bash
# 1. From the OLD location — make sure everything is committed & pushed
cd C:\HermesWork\community-directory
git status            # must be clean
git push origin main  # already done, but confirm

# 2. Copy the live .env (keys) to a safe temp spot — it is NOT in git
copy C:\HermesWork\community-directory\.env  C:\Temp\studyscout.env.bak

# 3. At the NEW location — clone fresh (gets all code, no secrets, no node_modules)
cd D:\whatever\new\parent
git clone https://github.com/jibranpcccc/groupscout.git
cd groupscout

# 4. Restore the .env
copy C:\Temp\studyscout.env.bak  .\groupscout\.env
#    (or: copy .env.example to .env and refill the keys)

# 5. Install deps (lockfile present → npm ci is reproducible)
npm ci

# 6. Regenerate the cached Netlify config (kills the old hardcoded path)
rmdir /s /q .netlify
netlify dev --no-open   # or just let CI handle builds; local CLI will rewrite .netlify

# 7. Verify it works in the new home
npm run typecheck
npx vitest run
npm run build
```

### 3.3 If you prefer a plain folder copy instead of clone

```bash
# Copy the folder, but EXCLUDE what must not move or must regenerate:
robocopy C:\HermesWork\community-directory  D:\new\groupscout  /E /XD node_modules .git .netlify .astro dist /XF .env
# then:
#  - copy .env separately (manual)
#  - run:  npm ci
#  - delete .netlify in the new location
#  - git will still work because .git came along
```
Note: a folder copy drags `.git` history with it (good), but `node_modules` (huge) is excluded — you re-install with `npm ci`.

### 3.4 After the move — sanity checklist
- [ ] `git remote -v` still shows `jibranpcccc/groupscout` (it travels with `.git`)
- [ ] `.env` present in new location (with `GEMINI_API_KEY`, `TAVILY_API_KEY`)
- [ ] `npm ci` succeeds
- [ ] `npm run typecheck` + `npx vitest run` green
- [ ] `.netlify/` deleted in new location (or it points at the old path)
- [ ] GitHub Actions still runs daily (it's on github.com, unaffected by the move)
- [ ] Live site still builds/deploys (push a trivial commit to trigger)

### 3.5 What does NOT need touching
- **GitHub Actions daily run** — runs on GitHub servers, not your machine. Moving the folder does not stop it. (If you delete the repo entirely without deleting the GitHub workflow, it keeps running and pushing to `main`.)
- **Netlify deploy** — triggered by GitHub push; location-independent.
- **Domain / GSC** — not set up yet, so nothing to migrate there.

---

## PART 4 — Publish the 1 pending record (when you approve)

```bash
npm run validate-links -- cand-mszv0u6k-ffkvyp   # re-confirm it's still active
npm run approve -- cand-mszv0u6k-ffkvyp          # owner-gated manual publish
git push origin main                             # triggers Netlify deploy
```

---

## PART 5 — Key file map (so nothing is lost in a move)

| File | Purpose |
|------|---------|
| `AGENTS.md` | Engineering constitution (study-prep niche, strict rules) |
| `docs/POST-CONVERSION-INTEGRITY-AUDIT.md` | Full 36-item audit evidence |
| `docs/CONVERSION-STATUS.md` | Original conversion status |
| `src/data/pending-groups.json` | The 2 held-for-approval records |
| `src/data/held-groups.json` | 15 held/rejected records w/ reasons |
| `src/data/groups.json` | Published listings (currently empty) |
| `src/data/rejected-candidates.json` | 178 rejected (gitignored? no — tracked) |
| `audit/telemetry/*.jsonl` | Observation data (**gitignored** — regenerates) |
| `scripts/data/holdNonActive.ts` | Enforces pending = active-only |
| `scripts/audit/observationReport.ts` | 7-day yield metrics (item #31) |
| `scripts/audit/funnel.ts` | Sequential funnel (item #2) |
| `scripts/safety/*` | Risk / affiliation / description guards |
| `scripts/data/autoApprove.ts` | Hardened gated auto-approve (disabled in workflow) |
| `.github/workflows/discover-groups.yml` | Daily discovery, pending-only, no auto-publish |
| `netlify.toml` | Build config (relative paths — safe to move) |
| `.env` | **Live API keys — gitignored, copy manually** |

---

*Generated as a hand-off document. The audit is complete; the remaining items are intentional deferrals (observation window, owner approval, domain migration) — none block continuing work in a new location.*
