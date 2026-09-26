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

Mirror automation:

- A recurring one-way sync checks GitHub main against GitLab main every hour.
- GitHub always wins on create/update/delete conflicts.
- Successful/no-op runs stay silent; only unreconciled drift should surface.

Setup único requerido para el mirror nativo:

1. Crear en GitLab un token para `simondalmasso/jobas` con alcance `write_repository`.
2. En GitHub, Settings → Secrets and variables → Actions, crear el secret `GITLAB_PUSH_TOKEN` con ese valor.
3. Ejecutar manualmente el workflow `mirror-gitlab` una vez o esperar el próximo push/cron.

Desde ese momento el espejo corre dentro de GitHub Actions y no depende de ChatGPT, Remote Desktop, MCP ni ningún conector.
