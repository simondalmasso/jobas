# Canonical repository

Authority: https://github.com/simondalmasso/jobas (`main`).

Replica: https://gitlab.com/simondalmasso/jobas.

## Rules

- GitHub `main` is the source of truth for code, docs and `data/gpt-*.json`.
- GitLab is a one-way mirror only.
- Never promote GitLab-only changes back to GitHub automatically.
- JOBAS production reads GPT radar findings from GitHub Raw.
- Mirror verification must compare the complete tracked tree, including deletes.
- Generated folders (`node_modules`, `dist`, `evidence`, `.wrangler`, `.firebase`) are not canonical.
- Firebase Hosting is not a second runtime. It may only redirect a public alias to the Cloudflare Worker.

## Runtime authority

Primary public runtime: https://jobas.simondalmasso44.workers.dev

Cloudflare Workers + KV remains the backend. The optional Firebase Hosting site `jobas` in project `jobas-d3c12` is configured only as an HTTP redirect layer; it must not contain Functions, rewrites to Firebase compute, databases, or duplicated application logic.

## Mirror status (2026-10-01)

The GitLab compute-minute blocker cleared after the monthly reset: scheduled pipelines now start on a shared runner.

The autonomous mirror is still **not healthy**. The latest scheduled `mirror_github_to_gitlab` job inspected on 2026-10-01 started normally and then failed during:

`git push --force --prune`

GitLab rejected the push because `main` is protected and force-push is not allowed. The current operational blocker is therefore protected-branch policy, not compute quota.

No personal access token, deploy token, GitHub secret, ChatGPT automation, SentinelX host, or Remote Desktop dependency is authorized for the permanent mirror. The intended path remains GitLab CI + `CI_JOB_TOKEN`, independent of interactive reconciliation.

## Acceptance gate

Do not call the mirror healthy merely because the trees match once.

Healthy requires both:

1. the scheduled GitLab CI mirror job actually completes successfully using the existing autonomous CI path; and
2. GitLab `main` reflects current GitHub `main` with complete tracked-tree diff = 0.

Until both conditions hold, GitLab is a stale/incomplete replica and GitHub remains the only authority.
