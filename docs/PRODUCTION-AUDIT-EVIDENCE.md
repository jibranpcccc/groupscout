# Production Audit Evidence — GroupScout (2026-08-18)

All checks executed against the PUBLIC site, not localhost.

## Build & repo

- Branch: `main` · HEAD: `be1fae0` (clean working tree)
- typecheck: PASS · lint: PASS · tests: PASS (60/60, 7 files) · validate-data: PASS · build: PASS

## Deployment

- Netlify Site ID: `d0979188-a441-489b-b61a-86d9d770ce9b`
- Netlify Deploy ID (final): see Netlify deploys API (latest ready deploy after `be1fae0`)
- Production URL: https://groupscout.netlify.app

## Dataset (real only — updated after wave-2 approval)

- Published REAL communities: **15** (all genuine; 8 additionally re-verified ACTIVE via Discord official API after approval)
  - Telegram: 5 · Discord: 10 (Python Discord, Reactiflux, Next.js, Svelte, Astro Lounge, Deno, Solana Tech, Chainlink Official, Aleo Network Foundation, Ollama — all official-source linked)
  - linkStatus: 10 active · 5 unknown (telegram preview blocked from this network — honest)
- Demo communities: **0**
- Pending: **0** (2 dead invites — discord.gg/freecodecamp, discord.gg/godot — API-confirmed 404 and deleted)
- Member counts: not stored — public Discord API did not return counts to the validator; never fabricated

## Public site verification (post-content)

- Demo-string scan across /, /communities/, /group/discord-python/, /category/ai-tech/, /category/crypto-web3/: **0 hits**
- Homepage: title "GroupScout", canonical https://groupscout.netlify.app/, counters computed = 15 listed / 2 categories / 2 platforms / 15 recently checked
- 15 group pages live (e.g. /group/discord-python/ → "Python Discord | Discord | GroupScout", "Link active")
- Category pages ai-tech + crypto-web3: `index, follow` (≥3 real communities)
- Sitemap: 13 base URLs + 15 group URLs, all production, zero localhost, zero demo
- noindex retained on /recently-added/, /recently-updated/, thin tags
- Security headers verified live: X-Content-Type-Options: nosniff · X-Frame-Options: DENY · Referrer-Policy: strict-origin-when-cross-origin · Permissions-Policy · Content-Security-Policy

## Guardrails (all active)

- `findProductionViolations` — validate-data FAILS on any isSample / example.com / "(Demo)" / "Demo fixture" (7 unit tests)
- `npm run approve` refuses demo records
- Telegram validator rejects personal/contact pages; Discord uses official API with guild requirement; WhatsApp cautious
- Sitemap filter = real counts from groups.json; thin/empty pages noindex + excluded
- Gemini retained as classifier only; API key never exposed; AUTO_PUBLISH_DISCOVERED=false

## Free search research (agent-verified 2026-08-18)

- **Tavily**: free 1,000 credits/month, NO card — recommended; adapter already in repo (`TAVILY_API_KEY`)
- Brave: free tier now requires credit card ($5/mo credits) — matches user report
- Google CSE: closed to new customers (sunsets 2027-01-01)
- Mistral: no web search API
- Full report: `docs/SEARCH-PROVIDER-RESEARCH.md`

## Remaining for user

1. Grab a free Tavily key (https://tavily.com/) → `.env` + GitHub secret `TAVILY_API_KEY` for daily auto-discovery
2. Optional: custom domain + Google Search Console (only after more content + a few days of link checks)
3. Screenshots deferred: browser automation needs manual "Allow remote debugging" in Chrome on this machine

