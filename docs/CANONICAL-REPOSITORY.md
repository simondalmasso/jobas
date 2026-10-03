# Canonical repository

## Authority

Canonical repository:

https://github.com/simondalmasso/jobas

Canonical branch:

`main`

Production code, documentation, configuration and curated radar data are authoritative only when present on GitHub `main`.

## Runtime

Primary runtime:

https://jobas.simondalmasso44.workers.dev

Public alias:

https://jobas.web.app

Firebase Hosting is redirect-only. It is not a second backend.

## Mirror

GitLab may be maintained as a one-way replica:

https://gitlab.com/simondalmasso/jobas

The mirror must never become a source of truth or automatically promote GitLab-only changes back into GitHub.

## Canonical data

The curated radar surface is intentionally limited to:

- `data/gpt-local.json`
- `data/gpt-remoto.json`

Generated folders, local QA artifacts, caches and secrets are not canonical.

## Change discipline

Product changes should follow:

```text
branch -> tests -> dry-run -> PR -> main -> deploy -> smoke test
```

Do not claim a deployment or mirror is healthy without current verification.
