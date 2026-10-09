# JOBAS product acceptance — 2026-10-09

**Verdict: HOLD.** This file tracks observed evidence and explicit unknowns, not a marketing readiness grade.

## Identity, deployment, releases

- Canonical `main`: `f5b88185549c58fa0ba5a4f56f6be0d1783fa426` at audit start.
- CI on that SHA: GitHub Actions `37506737543`, success.
- Last immutable tag/release `v1.1.0`: `7352c3d87f9de6c78cc9f7de003194244f7ad8cb`.
- Proposed patch version: `v1.1.1` **candidate only**, changelog and package metadata prepared; no tag, release or deployment.
- The difference to `main` after v1.1.0 is documentation / external M8ven trust metadata.
- Live worker: `https://jobas.simondalmasso44.workers.dev`.
- Firebase `https://jobas.web.app` redirects to the Worker.

## Production observations (before candidate fix)

- Live `/`, `/api/health`, `/api/feed`, `/api/sources`: HTTP 200.
- Live `GET /mcp`: HTTP 405, expected.
- Live `POST /mcp` initialize + tools/list: HTTP 200; exposed tool names were read-only.
- Live feed: 342 entries = 320 base + 22 curated; `/api/health.jobsCount` incorrectly returned 320. This was a confirmed defect.
- Feed generation date: `2026-10-08T10:15:43.722Z`; cron configured once daily at `15 10 * * *`.
- Listed sources: eight source adapters; `wwr` supplied RSS-style dates (not ISO), causing undated appearances in naïve consumers.
- Snapshot inspection: 247 ISO-parseable dates, 95 missing/unparseable dates, 58 of the dated entries older than 21 days, 29 older than 45 days, and 1 older than 90 days. These are *pre-fix* counts and are not evidence that any vacancy remains open.
- Argentina compatibility was unknown (`A verificar`) for 118 of the 342 records; JOBAS must not infer they are eligible.
- 22 curated entries report `verifiedAt` values; 320 aggregated entries do not. Source `healthy` previously meant fetching succeeded, not that job links were rechecked.
- Duplicate company/title scan of this snapshot: 0 detected using exact normalized company+title; this does not prove all semantic duplicates are absent.
- All 342 application URLs used HTTPS; redirect destination and whether each role was still recruiting **not exhaustively verified**.
- Bounded **HEAD-only** probe of 10 public application links sampled across 10 source groups: 8 returned HTTP 200, 2 returned HTTP 403 (We Work Remotely and Computrabajo). HTTP 403 may indicate anti-bot/access restrictions, not necessarily a removed posting. HTTP 200 proves transport availability, **not** that recruiting remains open. No definitive 404 detected in this small sample; 332 further records were not tested.

- Live Chromium with public feed (not mock): desktop 1440×900, mobile 390×844 and 360×800 passed layout/no-overflow; browser console errors=0. Profile creation, favorites, application tracking, saved search, folder and state persistence through reload passed using an isolated disposable browser profile. Penny visible; Coach correctly disconnected without a user credential.
- Native CV-to-profile extraction and live OpenRouter/Hugging Face provider responses: **NOT TESTED**, no user credential given. Manual profile entry works.
- CSP, HSTS, X-Content-Type-Options, X-Frame-Options and Referrer-Policy were present in the live browser test.
- `test/browser-live.mjs` correctly returned `LIVE_ACCEPTANCE=HOLD` due to mismatched feed/health counts. Other recorded individual checks were PASS.

## Candidate corrections (unreleased)

1. Consistent merged health count, including curated findings.
2. ISO normalization for RSS publication dates.
3. Explicit per-card provenance and aging labels, including unverified status; no claim that source fetch verifies links.
4. Fix missing/null salaries that could previously be interpreted as numeric zero.
5. Explicit Argentina exclusions override generic Worldwide marketing copy.
6. Curated file health reflects its declared update date, not a fabricated per-request live verification time.
7. Browser smoke covers 360px; production-no-mock browser script is available as a separate explicit command.
8. Wrangler dev-tool dependency advisory upgraded; verify final lockfile and run `npm audit`.
9. This readiness report replaces the outdated `v1.0.0`-exact-head requirement.
10. Curated LOCAL records now explicitly include their verified country Argentina; these had previously been incorrectly hidden by the default Argentina filter despite being Santa Fe listings.
11. If all live source fetches fail, the last good feed is retained with `stale=true`, explicit degraded source health, original generation date and refresh-failure timestamp; no invented fresh listings.


## Reproducible live-source sample (2026-10-09, no fake availability)

The audited production snapshot contained **342** opportunities, generated **2026-10-08T10:15:43.722Z**. The stable snapshot ID digest (SHA-256 over sorted job IDs/URLs) was `2985bc8b2bd2c7e912f671dbf13e82bc015ef697933ba8cf178937fde5bcdfa7`.

A bounded **46-link** sample was selected across **10 sources** using a fixed SHA-256 seed. Selection includes deterministic examples per source plus undated, over-45-day, Argentina-uncertain and LOCAL strata, capped at six links per source. Exact selected IDs, application URLs, timestamps, classifications and redirects are in [FEED_SAMPLE_2026-10-09.json](FEED_SAMPLE_2026-10-09.json), generated by `node scripts/audit-live-feed.mjs`. **There were no submitted applications and no provider AI calls.**

Outcomes on the source snapshot:
- 31 HTTP-reachable pages included matching job/company text: `LISTING_TEXT_OBSERVED_NOT_OPEN_VERIFIED`;
- 2 HTTP 200 pages had no recognizable specific-job text: `HTTP_REACHABLE_NOT_VACANCY_VERIFIED`;
- 13 were blocked with HTTP 403/429: `BLOCKED_OR_RATE_LIMITED` (access limitations, not proven removed roles);
- 0 conclusive HTTP 404/410 links or explicit closure text in **this sample**.

**Interpretation:** 31 text matches are evidence that the posting page contained identifiable listing text on the audit date, not evidence the employer was still hiring. 2 generic HTTP 200 outcomes and 13 blocked pages remain unresolved. The 342-job corpus was not exhaustively tested.

Feed-level metadata analysis: 19 postings had no parseable publication date under JavaScript's broader parser (compared with an earlier 95 ISO-only timestamp count); 30 were more than 45 days old, and 118 carried `A verificar` Argentina compatibility. Those uncertain jobs are excluded by the default Argentina-compatible filter. The candidate visibly marks unknown and old dates as needing verification.

**New confirmed source defect:** 14 WeRemoto application URLs in the original production KV snapshot contain literal `&amp;` in query strings. Two showed up in the 46-link sample. The candidate now decodes HTML query separators in `safeUrl` with a regression test. Existing production KV snapshots will **not** be corrected until the next authorized source refresh after release; deployment alone does not rewrite those records.

## Candidate real-browser verification (local Wrangler preview)

- Preview: local Cloudflare Wrangler 4.149.0 runtime at `http://127.0.0.1:8789`, real upstream source adapters and local KV namespace (not the fixture-based CI test server).
- Browser: isolated Chromium session with real returned vacancies; anonymous remote browsing, local radar, search (real and no-results), Argentina filter, profile, favorites, tracking, searches, folders, reload persistence, disconnected AI, Penny, 390/360/1440 layouts, and no console errors: **PASS**.
- MCP: initialize and tools/list over real HTTP, observed no mutation tool names: **PASS**.
- Headers: CSP, HSTS, nosniff, frame/referrer: **PASS**.
- Preview feed/health combined total: **PASS**.
- Source freshness and each individual posting's ongoing availability remain incompletely verified.
- Cloudflare network preview: `wrangler dev --remote --port 8791` using the candidate tree, remote Worker execution and read access to the existing feed in KV; `node test/browser-live.mjs` with `JOBAS_TEST_ORIGIN=http://127.0.0.1:8791` gave **PASS** for remote/local radar, browser state, 390/360/1440, CSP/HSTS, MCP and zero console errors. This is a **Cloudflare Remote Preview proxied locally**, not a publicly shared permanent preview URL or proof of a production deployment.
- Production has *not* been changed. No claim of exact SHA-to-production parity is made.

## Operating cost (code-based estimate, not a billing audit)

The Worker configuration schedules one `15 10 * * *` cron daily. The declared source registry makes 8 upstream source requests per successful refresh: approximately 240 upstream adapter requests and 30 KV writes over a 30-day month **at the planned cadence**. Actual redirects, retries, cold-start refreshes, user traffic, MCP use, storage, and provider policies can change usage. Local preview traffic is excluded from this estimate.

Cloudflare's published **Free** quota includes 100,000 Workers requests per day, 100,000 KV reads per day, 1,000 KV writes per day and 1 GB KV storage. Thus the base design could operate for **USD 0 incremental recurring platform cost if the account is on Free and stays within all limits**; this is *not* a confirmed account bill and does not guarantee all external source services have no cost. The Workers Paid plan has a published minimum charge of **USD 5/month**. No paid integration, token or subscription was enabled by this audit.

Sources (Cloudflare official):
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/kv/platform/limits/
- https://developers.cloudflare.com/workers/platform/pricing/

**Actual `RECURRING_COST_USD`: UNKNOWN** until the authenticated Cloudflare dashboard billing/usage is checked. Do not substitute the Free plan estimate for a receipt.

## Acceptance contract

```text
JOBAS_FINAL_ACCEPTANCE
MAIN_SHA=f5b88185549c58fa0ba5a4f56f6be0d1783fa426 [baseline, unchanged]
CI_TESTS=PASS baseline; CANDIDATE npm ci + verify PASS, 0 dependency vulnerabilities at last recorded clean run
REAL_BROWSER_DESKTOP=PASS production
REAL_BROWSER_MOBILE_390=PASS production
REAL_BROWSER_MOBILE_360=PASS production
FEED_FRESHNESS=PARTIAL [19 undated, 30 older than 45 days; refresh not proof of open status]
LIVE_SOURCE_CHECK=PARTIAL [46 links sampled, 31 listing-text matches, 2 generic HTTP 200, 13 blocked; vacancy-level open status unverified]
DEAD_LINKS=UNKNOWN [0 definitive 404/410 in 46 sampled; 13 inaccessible, 296 not sampled; 14 HTML-escaped links in production KV]
DEDUPLICATION=PASS exact title+company snapshot; semantic dedup unproven
ARGENTINA_ELIGIBILITY=PARTIAL [118 uncertain records]
SEARCH_AND_FILTERS=PARTIAL [remote/local, query, no-results and Argentina filter PASS candidate preview; all permutations untested]
PROFILE_AND_CV=PARTIAL [manual profile PASS; AI CV import not exercised]
FAVORITES_AND_TRACKING=PASS production reload
APPLICATION_WORKFLOW=PARTIAL [state tracked; no real application sent]
OPENROUTER_BYOK=PARTIAL [boundary/disconnected PASS; authenticated call untested]
MCP_READ_ONLY=PASS observed initialize/tools contract and static tests
PRIVACY_AND_SECURITY=PARTIAL [headers PASS both local and Cloudflare remote preview; npm audit 0 vulnerabilities in candidate; full security review pending]
ACCESSIBILITY=PARTIAL [responsive PASS; keyboard and screen-reader audit pending]
WORKER_HEALTH=FAIL production baseline counts 320 vs 342; PASS local/Cloudflare remote preview, not deployed
SOURCE_PROVENANCE=PARTIAL [age and verification labels PASS candidate preview; not deployed]
PRODUCTION_SHA=UNPROVEN [no exact candidate deployment]
RELEASE_TAG_SHA=7352c3d87f9de6c78cc9f7de003194244f7ad8cb
RECURRING_COST_USD=UNKNOWN [no actual Cloudflare billing/usage receipt; no provider key or paid service added]
CRITICAL_BUGS_OPEN=3 observed production defects [health count + empty LOCAL filter + 14 HTML-escaped application links]; candidate fixes unmerged and undeployed
NONCRITICAL_DEBT=external vacancy validity, age of listings, accessibility, OpenRouter/Penny provider/CV integration tests, actual billing proof
FINAL_VERDICT=HOLD
```

**Release boundary:** no production deploy, no tag movement, no GitHub Release and no merge to `main` until gates and explicit owner authorization. No M8ven score optimization.
