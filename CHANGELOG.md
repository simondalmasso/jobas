# Changelog

All notable product changes to JOBAS are documented here.

## Unreleased

## 1.1.2 — 2026-10-09 (Penny provider integration)

- Penny uses the same user-owned OpenRouter connection as Coach, with `openrouter/free` as its non-billable default text-model router. It never silently falls back to paid models.
- Hugging Face remains explicitly selectable with a separate user token; any HF usage follows that provider's own credit policy.
- Browser OAuth redirects return to the assistant that initiated connection; disconnecting OpenRouter invalidates the shared browser credential for Penny and Coach.
- Adds browser-simulated provider tests, a separate production status check, privacy wording and responsive Penny connection controls.
- No job feed, Cloudflare AI proxy, Worker inference requests, database, paid cloud service, or additional runtime backend.

Published as [v1.1.2](https://github.com/simondalmasso/jobas-latam-job-search/releases/tag/v1.1.2), commit `a7dedb672674f0513621fef247e561deda00b354`. Exact-commit CI, Cloudflare version preview and live production Chromium gates passed. Authenticated user-owned provider inference was not executed during release qualification.

## 1.1.1 — 2026-10-09

### Quality and reliability
- corrected full merged feed count in `/api/health` (including curated entries);
- restored LOCAL Santa Fe opportunities under the default Argentina compatibility filter by declaring country explicitly in curated source data;
- normalized RFC-822 RSS publication dates, preserved unknown/old vacancy status, and surfaced visible provenance/freshness cautions;
- preserved the last good public feed with an explicit stale warning if all automated upstream sources fail;
- corrected missing salary normalization and explicit Argentina exclusions;
- corrected HTML-escaped WeRemoto application query-string separators (production KV refreshed on 2026-10-09);
- upgraded Wrangler development tooling to remediate reported dependency advisories.

### Verification and documentation
- added unit regression cases and expanded 360px mobile smoke checks;
- added a separate non-mocked browser test against production or a local Cloudflare preview, with real public source data, no provider keys and no application submission;
- updated OSS readiness, privacy and contributor instructions with explicit HOLD criteria.

Published as [v1.1.1](https://github.com/simondalmasso/jobas-latam-job-search/releases/tag/v1.1.1) from commit `38d303297f2e776027c0e3aaafe1fadac4ea9eb0`; Cloudflare Worker version `51d205cd-a4d2-4448-953f-960cea8d1775` passed production acceptance after the feed refresh. Individual job availability and provider-backed BYOK flows were not exhaustively verified.

## 1.1.0 — 2026-10-03

### Product
- compact Penny assistant using the user's own Hugging Face token directly from the browser;
- lightweight desktop Notes, Paint and tic-tac-toe utilities;
- canonical Penny artwork integrated without changing the established retro JOBAS desktop identity.

### Trust and hardening
- OSS hardening baseline from v1.0.0 preserved;
- M8ven Trust Index badge and compact external-trust record added;
- MCP read-only, browser-local personal fit, BYOK boundaries, security headers and desktop/mobile browser gates preserved.

### Repository
- public MIT license;
- product-oriented README and documentation;
- security, privacy and contribution policies;
- issue and pull-request templates;
- package metadata and Node.js 22 requirement.

## 1.0.0 — 2026-10-02

### Product
- public remote/local opportunity radar;
- browser-local profile, applications, favorites, saved searches and folders;
- personalized search over the JOBAS feed;
- user-owned OpenRouter interview Coach with text and optional browser voice;
- public read-only MCP;
- Cloudflare Worker + Static Assets + KV runtime;
- Firebase redirect alias.

The repository did not use release tags before this documentation pass; this entry records the current product baseline rather than claiming a historical GitHub Release.
