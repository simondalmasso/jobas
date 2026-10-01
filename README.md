# JOBAS

Radar público de oportunidades para Argentina/LatAm: empleos remotos y locales, seguimiento de postulaciones, microjobs y prospectos accionables. Incluye un MCP público read-only para agentes.

## Acceso público

- Aplicación / backend canónico: https://jobas.simondalmasso44.workers.dev
- MCP público: https://jobas.simondalmasso44.workers.dev/mcp
- Alias Firebase solicitado: https://jobas.web.app

Cloudflare Workers sigue siendo el único runtime de JOBAS. Firebase Hosting se usa exclusivamente como alias de redirección HTTP hacia Cloudflare: no hay Functions, rewrites, base de datos ni backend duplicado en Firebase.

La configuración de esa capa está en `firebase.json` y `.firebaserc`. El target previsto es el sitio Firebase Hosting `jobas` dentro del proyecto `jobas-d3c12`. El deploy del alias es manual; no existe cron ni workflow que lo ejecute periódicamente.

## Canon y espejo

Repositorio principal: https://github.com/simondalmasso/jobas

Espejo: https://gitlab.com/simondalmasso/jobas

`GitHub/main` es la única autoridad para código, documentación y archivos de radar. GitLab es una réplica unidireccional y nunca debe ganar conflictos.

## Datos de radar

- `data/gpt-local.json`: vacantes locales/presenciales.
- `data/gpt-remoto.json`: vacantes remotas.
- `data/gpt-telegram.json`: oportunidades verificadas desde Telegram.
- `data/gpt-prospectos.json`: demanda directa, microjobs y leads con permalink/contacto verificables.
- `data/telegram-sources.json`: fuentes y cursores del radar Telegram.

JOBAS consume estos archivos desde GitHub Raw y los normaliza en el feed público.

## Interfaz

La web organiza el trabajo en cuatro vistas:

- REMOTO
- LOCAL
- EN CURSO
- PROSPECTOS MICROJOBS

La navegación superior es funcional: permite cambiar vistas, limpiar/alternar filtros, ocultar el panel lateral, abrir fuentes, enfocar búsqueda y acceder a producción/MCP/CANON. Atajos: `/` busca, `1–4` cambia de vista, `T` muestra/oculta navegación y `S` abre/cierra fuentes.

Las postulaciones tradicionales conservan el flujo de CV. Telegram, microjobs y marketplaces usan contacto/propuesta directa y seguimiento con `LINK DIRECTO`.

## Runtime

- Cloudflare Workers + Static Assets + KV.
- Sin login obligatorio.
- Sin Gmail, CV/PDF, chat ni Workers AI en el runtime.
- Cron diario existente del feed: `15 10 * * *`.
- El MCP no agrega cron, polling ni loop de background.
- Los visitantes y agentes leen el snapshot; no disparan el radar completo.
- Ocho fuentes automáticas: WeRemoto, Freehire, Carryer Tech, Remote OK, Remotive, Himalayas, Jobicy y We Work Remotely.

## MCP público

`POST /mcp` expone un MCP stateless/read-only. La entrada recomendada para un agente es `agent_bootstrap`.

Tools del feed: `agent_bootstrap`, `jobas_status`, `list_jobs`, `search_jobs`, `inspect_job`, `rank_jobs`, `list_microjobs`, `list_sources` y `mcp_status`.

Tools de apoyo público: `research_github_readme`, `research_github_file`, `research_zero_cost_catalog`, `skill_list`, `skill_route` y `skill_get`.

Los skills ligeros se cargan bajo demanda; crawlers, navegadores, modelos y providers externos no se ejecutan dentro del Worker.

## Firebase: alias de redirección

Prerequisito único: que Firebase Hosting permita crear/asignar el site ID `jobas` al proyecto `jobas-d3c12`.

Comandos manuales:

```bash
npm run firebase:sites
npx --yes firebase-tools hosting:sites:create jobas --project jobas-d3c12
npm run firebase:deploy:redirect
```

La configuración responde con redirecciones temporales `302` hacia el Worker, incluyendo rutas. Se usa `302` durante la puesta en marcha para evitar cachear una asignación incorrecta; puede pasarse a `301` cuando el alias quede confirmado.

## Desarrollo y verificación

```bash
npm ci
npm test
npm run dry-run
```

Deploy Cloudflare manual autorizado:

```bash
npm run deploy
```

GitHub Actions ejecuta tests + dry-run sobre `main` y pull requests.
