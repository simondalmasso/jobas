# Changelog

All notable product changes to JOBAS are documented here.

## 1.0.0 — 2026-10-03

### Product
- public remote/local Argentina/LatAm opportunity radar;
- browser-local profile, applications, favorites, saved searches and folders;
- personalized search with candidate fit computed only in the browser;
- user-owned OpenRouter interview Coach with text and optional browser voice;
- CV-to-profile flow that bypasses the JOBAS Worker;
- public stateless read-only MCP;
- Cloudflare Worker + Static Assets + KV runtime;
- Firebase redirect alias.

### OSS hardening
- MIT license, public repository metadata and contribution/security policies;
- manually curated opportunities moved from runtime source into source-backed `data/` files;
- server ordering refactored to generic public quality signals rather than owner/candidate fit;
- strict CSP, HSTS, clickjacking, MIME, referrer and permissions headers;
- explicit BYOK threat model and PKCE/state/storage tests;
- first-class MCP contract documentation and read-only tests;
- lean real-browser acceptance gate for desktop and mobile;
- favicon/social metadata and public product documentation.

### Known limitations
- the radar is intentionally focused on Argentina/LatAm rather than global coverage;
- curated source-backed records require periodic verification/freshness maintenance;
- the AI Coach requires the user to connect their own OpenRouter account/key;
- browser speech recognition availability depends on the user's browser/platform.
