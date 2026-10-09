# OSS and Product Readiness

Canonical repository: https://github.com/simondalmasso/jobas

**Release history is immutable.** `v1.0.0` records the first hardened OSS baseline; `v1.1.0` points to `7352c3d87f9de6c78cc9f7de003194244f7ad8cb`. New documentation merges after that release do not require moving a published tag. The proposed corrections are scoped to a separate `v1.1.1` patch candidate (unreleased). Any subsequent functional change requires a *new* semver version and explicit deployment/release approval.

## Gates

| Surface | Acceptance evidence |
| --- | --- |
| Main | GitHub `main`; verify exact SHA before qualification |
| CI | `npm ci && npm run verify` (Node contracts, Wrangler dry-run, headless browser); inspect job conclusion |
| Browser mock-free | `npm run test:live-browser`, directly against the deployed public Worker (separate from the mocked CI smoke) |
| Desktop/mobile | Test 1440×900, 390×844, **360×800**, browser reload, no horizontal overflow or console errors |
| Health | `/api/health` must report the **merged** `/api/feed` count, including curated items |
| Feed quality | Clearly distinguish publication age, source metadata, declared verification and **unverified vacancy status** |
| Application workflow | Open external link only after user intent; never claim an application was submitted |
| Privacy | No personal profile/CV sent to JOBAS Worker; optional BYOK flows directly to user's provider |
| MCP | `POST /mcp` initialize / tools/list works; `GET /mcp` returns 405; tools read-only |
| Security | CSP, HSTS, nosniff, frame and referrer headers; dependency audit; input escaping |
| Runtime | Compare preview deployed from exact candidate HEAD, then production only after authorization |
| Cost | Confirm runtime limits and actual billing/usage; code-only estimates are not billing evidence |

## Current product acceptance

**HOLD / pending final gates.** See [dated acceptance report](PRODUCT_ACCEPTANCE_2026-10-09.md).

A passing mocked CI browser test is not sufficient to declare the public feed current or every outbound job link valid. Likewise a source adapter returning successfully is not proof every listed vacancy is still open.

The 2026-10-09 audit identified a live mismatch between `/api/health` (320) and `/api/feed` (342), RFC-822 RSS dates not normalized, some outdated/undated entries, and dev-tool dependency advisories. The isolated fix branch addresses these defects and passed both local Wrangler and Cloudflare Remote Preview browser checks against actual public feed data. A deterministic 46-link audit records 31 listing-text matches, 2 generic HTTP 200 and 13 inaccessible links, without asserting vacancies remain open. The 14 HTML-escaped WeRemoto URLs in the existing KV snapshot also require a source refresh after release. All fixes remain **unreleased** until reviewed, approved and deployed. Do not represent branch-only fixes as production behavior.

## Repeatable verification

```sh
git clone https://github.com/simondalmasso/jobas.git
cd jobas
npm ci
npm run verify
npm run test:live-browser
```

The last command targets the public Worker with a disposable Chromium profile, makes no applications or provider calls and intentionally fails if live production gates are broken. It requires Chrome/Chromium and network access. To test a candidate preview set `JOBAS_TEST_ORIGIN` to its URL. An OpenRouter-connected paid/third-party interaction cannot be declared green without separate user-owned credentials and permission.
