# JOBAS — Computer Job Assistant

Public job radar and personal job-search workspace for Argentina/LatAm.

**Live app:** https://jobas.web.app  
**Primary runtime:** https://jobas.simondalmasso44.workers.dev  
**Public MCP:** https://jobas.simondalmasso44.workers.dev/mcp

[![CI](https://github.com/simondalmasso/jobas/actions/workflows/ci.yml/badge.svg)](https://github.com/simondalmasso/jobas/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![M8ven Score](https://m8ven.ai/badge/mcp/simondalmasso-jobas-17b8z9)](https://m8ven.ai/mcp/simondalmasso/jobas?s=readme)

## What JOBAS does

JOBAS combines a public opportunity radar with a browser-local workspace for managing a job search.

- **Remote + local radar** for Argentina/LatAm.
- **Profile-driven search** without requiring an account.
- **Application tracking**, favorites, saved searches and custom folders.
- **Application workflow** that distinguishes traditional CV-based jobs from direct-contact opportunities.
- **AI interview Coach** with text and optional browser voice.
- **Public read-only MCP** for agents and external tools.

The product keeps infrastructure deliberately small: Cloudflare Workers + Static Assets + KV, source-backed curated data files and native browser storage for personal workspace state.

## Product principles

1. **Public first.** Browsing the radar does not require login.
2. **Human in the loop.** JOBAS organizes and assists; it does not silently apply on behalf of the user.
3. **User-owned AI.** The interview Coach connects directly to the user's OpenRouter account.
4. **Low-cost runtime.** No hidden AI proxy, no hourly browser agents and no background inference in the Worker.
5. **Traceable opportunities.** Source links, geography, compensation and freshness stay visible.
6. **Small canonical surface.** GitHub `main` is authoritative.

## AI Coach: cost boundary

JOBAS does **not** pay for or proxy AI inference.

```text
user browser ───────────────> OpenRouter
       │
       └── profile / CV / interview context
```

Not:

```text
browser -> JOBAS Worker -> AI provider
```

The provider credential belongs to the user, is browser-side, and defaults to session-only storage.

See [Privacy and data flow](docs/PRIVACY.md).

## Architecture

```text
GitHub main
   │
   ├── data/gpt-local.json
   ├── data/gpt-remoto.json
   └── data/curated-local.json
            │
            ▼
     Cloudflare Worker
      feed + MCP + app
            │
            ▼
         Browser
   ┌────────┴─────────┐
   │                  │
local workspace   optional AI Coach
                      │
                      ▼
                 OpenRouter
              (user-owned account)
```

Full details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Repository layout

```text
.
├── public/                  # Browser application
│   ├── app.js               # Main UI + feed interaction
│   ├── coach.js             # User-owned AI provider boundary
│   ├── profile.js           # Browser-local profile
│   ├── user-memory.js       # Favorites, searches, folders
│   ├── workflow.js          # Apply/contact workflow
│   ├── index.html
│   └── styles.css
├── src/                     # Cloudflare Worker
│   ├── index.js             # Routes, feed, scheduled refresh
│   ├── sources.js           # Automatic opportunity sources
│   ├── judge.js             # Normalization + generic public quality
│   └── mcp.js               # Public read-only MCP
├── data/
│   ├── gpt-local.json
│   ├── gpt-remoto.json
│   └── curated-local.json
├── test/                    # Node test suite
├── docs/                    # Architecture, privacy, research
├── firebase-public/         # Redirect-only Firebase alias
├── wrangler.jsonc
└── package.json
```

## Local development

Requirements:

- Node.js 22+
- npm

```bash
git clone https://github.com/simondalmasso/jobas.git
cd jobas
npm ci
npm run dev
```

Verification:

```bash
npm run verify
```

That runs Node contracts, Wrangler dry-run and the lean browser acceptance gate:

```bash
npm test
npm run dry-run
npm run test:browser
```

## Deployment

Primary deployment:

```bash
npm run deploy
```

Firebase is only a public alias/redirect layer:

```bash
npm run firebase:deploy:redirect
```

It does not host a second backend.

## Radar data

JOBAS keeps source-backed curated inputs under `data/`. Named/manual opportunities live there rather than inside Worker source code. Server ordering uses generic public quality signals only; candidate fit is computed in the browser from the user's local profile.

Automated sources are normalized and merged into the public feed by the Worker.

Research notes for opportunity sources live under [docs/research/](docs/research/).

## Public MCP

Endpoint:

```text
POST https://jobas.simondalmasso44.workers.dev/mcp
```

The MCP is public, stateless and read-only. Recommended first tool for agents: `agent_bootstrap`. Full contract: [docs/MCP.md](docs/MCP.md).

It does not create applications, store provider secrets or start background browsers.

## Security and privacy

- [Security policy](SECURITY.md)
- [Privacy and data flow](docs/PRIVACY.md)
- [Contributing](CONTRIBUTING.md)
- [Canonical repository rules](docs/CANONICAL-REPOSITORY.md)

Never commit API keys, CVs, browser sessions or personal candidate data.

## License

JOBAS is released under the [MIT License](LICENSE).

Copyright © 2026 Simón Dalmasso.

---

**Built on GitHub + Cloudflare Workers. Optional AI uses the user's own OpenRouter account.**
