# Changelog

All notable product changes to JOBAS are documented here.

## Unreleased

## 1.1.1 — candidate, release approval pending

### Quality and reliability
- corrected full merged feed count in `/api/health` (including curated entries);
- restored LOCAL Santa Fe opportunities under the default Argentina compatibility filter by declaring country explicitly in curated source data;
- normalized RFC-822 RSS publication dates, preserved unknown/old vacancy status, and surfaced visible provenance/freshness cautions;
- preserved the last good public feed with an explicit stale warning if all automated upstream sources fail;
- corrected missing salary normalization and explicit Argentina exclusions;
- corrected HTML-escaped WeRemoto application query-string separators (the public KV feed still needs its next source refresh after deployment);
- upgraded Wrangler development tooling to remediate reported dependency advisories.

### Verification and documentation
- added unit regression cases and expanded 360px mobile smoke checks;
- added a separate non-mocked browser test against production or a local Cloudflare preview, with real public source data, no provider keys and no application submission;
- updated OSS readiness, privacy and contributor instructions with explicit HOLD criteria.

This candidate is **not released** or deployed. Revalidate final CI, public source availability and exact-artifact production behavior before approving merge/deployment/tag.

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
