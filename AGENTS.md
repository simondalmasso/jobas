# AGENTS.md

Operational guidance for coding agents working on JOBAS.

## Canon

- Repository: `simondalmasso/jobas`
- Canonical branch: `main`
- Production: `https://jobas.simondalmasso44.workers.dev`
- Public alias: `https://jobas.web.app`
- Runtime: Cloudflare Workers + Static Assets + KV
- UI: plain browser JavaScript/CSS; preserve the retro desktop identity

## Layout

- `public/` — browser product, local profile/memory, personal-fit logic and user-owned AI Coach
- `src/` — public Worker, source adapters, generic quality scoring and read-only MCP
- `data/` — source-backed curated opportunity inputs
- `test/` — Node contracts plus browser acceptance
- `docs/` — architecture, privacy, MCP and OSS notes

## Commands

```bash
npm ci
npm test
npm run dry-run
npm run test:browser
npm run verify
```

All must pass before merge when the browser runner is available.

## Invariants

1. Personal candidate fit is browser-side only. Never add owner/candidate role preferences to server ranking.
2. Server ordering may use generic public signals only: source/risk evidence, freshness, published compensation, worker fees and geographic compatibility.
3. Curated opportunities belong in `data/`, never as named job literals in runtime source.
4. OpenRouter is user-owned. Browser -> OpenRouter directly. Never proxy provider credentials, CVs, inference, transcription or speech through the Worker.
5. Default provider credential storage is `sessionStorage`; persistence requires explicit opt-in; disconnect clears both session and persistent copies.
6. Never commit API keys, cookies, sessions, CVs or personal candidate records.
7. The public MCP is stateless/read-only. Do not add mutation, messaging or application-submission tools.
8. No backend user database or login unless the product architecture is explicitly changed.
9. Do not add autonomous application submission or background browser swarms.
10. Every public opportunity must preserve source/provenance fields; do not fabricate salary or verification facts.

## Change workflow

```text
branch -> focused change -> tests -> dry-run -> browser smoke for UI changes -> PR -> main -> deploy -> production smoke
```

Do not claim CI, mirror, release or production health without current verification.
