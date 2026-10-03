# Architecture

JOBAS is a small public web application built on Cloudflare Workers and Static Assets.

## Runtime

```text
                         GitHub main
                            │
            ┌───────────────┴───────────────┐
            │                               │
     data/gpt-local.json             data/gpt-remoto.json
            │                               │
            └───────────────┬───────────────┘
                            │
                    Cloudflare Worker
                 feed + MCP + static app
                            │
                         Browser
          ┌─────────────────┼──────────────────┐
          │                 │                  │
   browser-local state   public feed      AI Coach (optional)
          │                                    │
 profile / favorites                    direct connection
 searches / folders                     to OpenRouter
 applications                                 │
                                               └─ user account/key
```

## Components

### `public/`

Browser application.

- `app.js` — product UI, feed interaction and application workflow.
- `profile.js` — browser-local candidate profile.
- `user-memory.js` — favorites, searches and user folders.
- `coach.js` — user-owned OpenRouter connection and browser speech helpers.
- `workflow.js` — application/contact workflow classification.
- `styles.css` — retro desktop visual system.

### `src/`

Cloudflare Worker.

- `index.js` — HTTP routes, feed orchestration and scheduled refresh.
- `sources.js` — automatic opportunity sources.
- `judge.js` — normalization, classification and ranking helpers.
- `mcp.js` — public read-only MCP.

### `data/`

Canonical manually curated radar inputs.

Only:

- `gpt-local.json`
- `gpt-remoto.json`

### `test/`

Node test suite covering feed, workflow, MCP, UI contracts, profile, memory and Coach boundaries.

## AI boundary

AI is intentionally outside the Worker:

```text
Browser -> OpenRouter
```

Not:

```text
Browser -> JOBAS Worker -> OpenRouter
```

This keeps provider cost and credentials attached to the user's own account.

## Persistence

- Cloudflare KV: public feed snapshot/runtime state.
- Browser local/session storage: private user workspace state.
- GitHub: canonical code, configuration and curated radar data.

## Scheduling

One existing cron refresh:

```text
15 10 * * *
```

No hourly browser automation, AI polling or hidden user-specific jobs are part of the runtime.

## Deployment

Primary runtime:

`https://jobas.simondalmasso44.workers.dev`

Firebase Hosting is only an alias/redirect layer. It is not a second backend.
