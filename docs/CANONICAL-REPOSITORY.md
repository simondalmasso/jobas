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
