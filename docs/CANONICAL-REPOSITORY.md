# Canonical repository

Authority: https://github.com/simondalmasso/jobas (main).

Replica: https://gitlab.com/simondalmasso/jobas.

Rules:

- GitHub main is the source of truth for code, docs and data/gpt-*.json.
- GitLab is a one-way mirror only.
- Never promote GitLab-only changes back to GitHub automatically.
- JOBAS production reads GPT radar findings from GitHub Raw.
- Mirror verification must compare the complete tracked tree, including deletes.
- Generated folders (node_modules, dist, evidence, .wrangler) are not canonical.

Mirror status (2026-09-30):

- No personal access token, deploy token, GitHub secret, ChatGPT automation, SentinelX host, or Remote Desktop dependency is authorized for the permanent mirror.
- The repository contains a GitLab CI self-mirror job that reads public GitHub and writes GitLab with CI_JOB_TOKEN, so it needs no user-managed secret.
- GitLab.com scheduled pipelines are currently blocked before a runner starts with failure_reason=ci_quota_exceeded. Therefore this path is not an active automatic mirror today.
- GitLab native pull mirroring would satisfy the architecture without a runner or personal secret, but GitLab documents pull mirroring as Premium/Ultimate; the current project is on the Free plan.
- Until either GitLab CI compute quota becomes available or the GitLab project gains pull-mirroring capability, syncs performed through an interactive connector are reconciliation only, not the permanent automation.

Acceptance gate:

- Do not call the mirror healthy merely because the trees match once.
- Healthy requires both: complete tracked-tree diff = 0 and a verified autonomous GitHub -> GitLab update path that does not depend on a personal secret, ChatGPT, SentinelX, or Remote Desktop.
