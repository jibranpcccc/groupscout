# Free Web-Search API Research for GroupScout (verified 2026-08-18)

**Goal:** a $0, no-credit-card web-search API capable of ~10–30 searches/day for the GroupScout discovery pipeline.
**Context:** Gemini Google-Search grounding is quota-blocked on the free key; repo already has working Brave (`BRAVE_API_KEY`) and Tavily (`TAVILY_API_KEY`) adapters.
**Method:** Hermes `web_search`/`web_extract` (Tavily-backed) were DOWN on this machine (connection refused), so all facts below were verified via direct HTTP fetches of provider pages/docs and independent third-party sources, retrieved live on 2026-08-18. Sources are cited inline.

---

## Per-provider table

| Provider | Free tier limit | Card required? | Signup steps | Fit for 30/day |
|---|---|---|---|---|
| **Tavily** | **1,000 credits/month** (1 credit = 1 basic search; 2 = advanced) → ~1,000 basic searches/mo. 100 RPM rate limit (dev key). **Keyless mode**: free search/extract with NO account at all (rate-limited, exact limit not published). | **No** — official docs state "1,000 free API Credits every month. **No credit card required.**" | 1) app.tavily.com → sign up (email) 2) create API key 3) call `api.tavily.com/search`. Zero-setup alternative: send `X-Tavily-Access-Mode: keyless` header, no key. | ✅ **Excellent** — 30/day ≈ 900/mo fits in 1,000. Existing adapter already in repo. |
| **Brave Search API** | **$5/month free credits** (~1,000 queries at $3–5/1k). Old card-free tier (2,000 queries/mo) **discontinued**. | **Yes** — "All plans now require a credit card, including to use the included credits" (scavio.dev, 2026); implicator.ai: "Credit cards collected" at signup. Matches user's report of being asked for $5. | 1) api-dashboard.search.brave.com 2) create account + **enter payment method** 3) get `X-Subscription-Token` key. | ⚠️ **No for $0** — free credits exist but a card is required to even use them. |
| **Google Programmable Search (Custom Search JSON API)** | 100 queries/day free (existing customers); extra $5/1k up to 10k/day. | No card needed for the free 100/day (billing optional), **but moot**: | **Closed to new customers.** Google's own docs (fetched live): "The Custom Search JSON API is **closed to new customers**... pricing applies only to existing Custom Search JSON API customers until the service discontinuation on **January 1, 2027**." Replacement (Vertex AI Search) needs a billing account. | ❌ **Dead end for new signups.** |
| **Mistral** | NO standalone search API. Has built-in **`web_search` / `web_search_premium` connector tools** in the Agents API (beta): create agent with `tools=[{"type":"web_search"}]`, model searches and answers with citations (docs.mistral.ai). | Requires Mistral API key; search usage is billed as API usage (pricing not published in docs; mistral.ai/pricing "Web searches" row is client-rendered). Free-tier (card-less) availability of websearch: **unverified**. | 1) console.mistral.ai 2) API key 3) create agent with web_search tool. | ⚠️ **No** — agent-tool only (not a raw search API), billing-dependent, cannot verify $0 path. |
| **Serper.dev** | **2,500 free queries (ONE-TIME**, not monthly) — Google results. | **No** — own homepage: "Get 2,500 free queries… **No credit card required**". | 1) serper.dev signup 2) free API key 3) POST to `https://google.serper.dev/search`. | ✅ short-term — 30/day drains 2,500 in ~83 days, then paid ($50/mo). Good card-free stopgap/backup. |
| **SerpApi** | Free plan ~**100 searches/month**. | Not stated on pricing page — **unverified**. | 1) serpapi.com signup 2) free plan key. | ❌ Too small (100/mo vs ~900/mo needed) + unverified card policy. |
| **Jina AI (`s.jina.ai` search endpoint)** | Free API key, rate-limited search+reader (exact free quota not verified). Search endpoint now **requires a key** (live test returned 401 without one). | Widely reported no card for free account — **not verified live**. | 1) jina.ai free account 2) API key 3) `GET https://s.jina.ai/?q=...` with Bearer. | ⚠️ Possible backup; quotas unverified. |
| **DuckDuckGo via `ddgs` / `duckduckgo_search` (unofficial)** | No published cap; practical limit for light use (~10–30/day fine). | **No** — no account, no key, no card. | 1) `pip install ddgs` 2) call `ddgs.text(query)`. | ✅ volume-wise, but **unofficial scraping** — rate-limits/ToS risk; not an official API. |
| **SearXNG (self-hosted)** | Unlimited (your own server aggregates Bing/Google/DDG/etc.). | **No** — free, open-source, no key. | 1) run Docker container 2) query `http://localhost:8080/search?q=...&format=json`. | ✅ volume-wise; needs hosting/ops. Overkill for 30/day. |

---

## RECOMMENDATION

**Use Tavily's free plan as the primary GroupScout search provider.**

- **1,000 credits/month, explicitly no credit card required** (verified in Tavily's official "Credits & Pricing" docs, live 2026-08-18), and the repo already ships a `TAVILY_API_KEY` adapter — zero code change.
- At 30 searches/day (~900/month) using basic search depth (1 credit/search), the free tier covers the full requirement with headroom. Keep `search_depth="basic"` to stay at 1 credit/query.
- **Fallback chain:** ① Tavily keyless (header `X-Tavily-Access-Mode: keyless`) — same API, zero setup, no account — for burst/overflow; ② **Serper.dev** 2,500 one-time free queries, no card, as a card-free backup that buys ~2–3 months; ③ existing **Brave** key only if a card is acceptable (new keys require payment method; $5/mo credits ≈ 1,000 queries).
- **Do not** pursue Google CSE (closed to new customers, sunsets Jan 1, 2027) or Mistral (no standalone search API; billing-dependent agent tool) for this pipeline.

---

## What could NOT be verified, and why

1. **Mistral websearch pricing & free-tier access** — docs describe the tool but publish no per-search price; mistral.ai/pricing renders the "Web searches" price cells client-side (empty in static HTML). Whether a card-less free API key can actually invoke `web_search` is unconfirmed. Would need an account to test.
2. **Brave's exact signup flow** — "card required" is corroborated by three independent 2026 sources plus Brave's own "$5 free monthly credits" copy, but the signup form itself is behind JS/login; a live account creation test wasn't possible without providing payment data.
3. **SerpApi free-plan card policy & Jina free quota** — not stated on the fetched pages; no live signup performed.
4. **Tavily keyless rate limit** — docs say "free and rate-limited" without publishing the number.
5. **Live API end-to-end calls** — no free keys were on hand in this environment to fire real searches (and the machine's own Tavily backend was refusing connections), so all limits above are from primary docs/pages fetched today, not from measured usage. Providers change tiers often — re-verify before committing.
