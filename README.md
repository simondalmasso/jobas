# JOBAS

Feed público sin login para oportunidades remotas y locales, priorizado para Argentina.

Producción: https://jobas.simondalmasso44.workers.dev

MCP público: https://jobas.simondalmasso44.workers.dev/mcp

## Canon

Repositorio principal: https://github.com/simondalmasso/jobas

Espejo: https://gitlab.com/simondalmasso/jobas

GitHub main es la única autoridad de código, documentación y archivos de radar. GitLab es réplica unidireccional.

Los radares GPT escriben en:

- data/gpt-local.json
- data/gpt-remoto.json
- data/gpt-telegram.json

JOBAS consume esos archivos desde GitHub Raw.

## Runtime

- Cloudflare Workers + Static Assets + KV.
- Sin login, Gmail, CV/PDF, chat ni Workers AI.
- Cron diario existente del feed: 15 10 * * *.
- El MCP NO agrega cron horario, polling ni loop de background.
- Ocho fuentes automáticas: WeRemoto, Freehire, Carryer Tech, Remote OK, Remotive, Himalayas, Jobicy y We Work Remotely.
- Fuentes independientes y fail-isolated.
- Los visitantes y agentes leen el snapshot; no disparan el radar completo.

## MCP público

`POST /mcp` implementa un MCP stateless/read-only inspirado en el transporte público de ATM. Un agente puede inicializar, listar tools y empezar por `agent_bootstrap` para obtener estado, oportunidades prioritarias, microjobs y siguientes acciones en una sola llamada.

Tools nativas: `agent_bootstrap`, `jobas_status`, `list_jobs`, `search_jobs`, `inspect_job`, `rank_jobs`, `list_microjobs`, `list_sources` y `mcp_status`.

También expone lectura pública acotada de GitHub y skills install-free bajo demanda: `research_github_readme`, `research_github_file`, `research_zero_cost_catalog`, `skill_list`, `skill_route` y `skill_get`.

Curaduría liviana incluida: Superpowers, Addy Osmani Agent Skills y Cloudflare Security Audit. Los skills se leen desde sus repos públicos solamente cuando un agente los pide; no se instalan runtimes pesados dentro del Worker.

Crawl4AI, Scrapling, Firecrawl, browser-use, Stagehand, Playwright, Laya/Lev y similares se clasifican como runtimes externos, no como dependencias del Worker. Exa, Parallel Search y Wolfram quedan como providers externos porque incrustarlos públicamente requeriría credenciales/cuenta/costo compartido.

## Feed

- REMOTO
- LOCAL
- EN CURSO

El ranking pondera elegibilidad Argentina/LatAm, fuente/riesgo, pago conocido, ausencia de pay-to-apply, frescura y afinidad de categoría.

## Verificación

npm ci
npm test
npm run dry-run

Deploy manual autorizado: npm run deploy

El workflow de GitHub Actions ejecuta tests + dry-run en main y pull requests.
