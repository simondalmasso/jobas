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

GitLab is maintained as a one-way replica:

https://gitlab.com/simondalmasso/jobas

The scheduled mirror fetches GitHub `main` and pushes it without force-pushing the protected branch. The mirror must never become a source of truth or automatically promote GitLab-only changes back into GitHub. Mirror health still requires a successful GitLab pipeline plus SHA equality with GitHub `main`.

## Canonical data

Curated opportunity data lives under `data/`. Current source-backed surfaces are:

- `data/gpt-local.json`
- `data/gpt-remoto.json`
- `data/curated-local.json`

Runtime source must not contain named manually curated job literals.

Generated folders, local QA artifacts, caches and secrets are not canonical.

## Change discipline

Product changes should follow:

```text
branch -> tests -> dry-run -> PR -> main -> deploy -> smoke test
```

Do not claim a deployment or mirror is healthy without current verification.
