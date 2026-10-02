# JOBAS

Radar público de oportunidades para Argentina/LatAm. JOBAS concentra empleos remotos y locales, permite filtrarlos y mantener un seguimiento liviano de postulaciones en curso.

## Acceso público

- Aplicación / backend canónico: https://jobas.simondalmasso44.workers.dev
- MCP público: https://jobas.simondalmasso44.workers.dev/mcp
- Alias Firebase: https://jobas.web.app

Cloudflare Workers sigue siendo el único runtime. Firebase Hosting se usa únicamente como alias/redirección; no duplica backend, datos ni lógica.

## Canon

Repositorio principal: https://github.com/simondalmasso/jobas

Espejo: https://gitlab.com/simondalmasso/jobas

`GitHub/main` es la autoridad de código, documentación y configuración de JOBAS.

## Datos de radar

JOBAS conserva únicamente dos archivos JSON de radar:

- `data/gpt-local.json` — oportunidades locales/presenciales.
- `data/gpt-remoto.json` — oportunidades remotas.

No hay datasets propios de Prospectos ni Telegram dentro de JOBAS.

## Interfaz

La aplicación abre directamente en la interfaz principal. No hay pantalla de arranque, consola simulada ni emulación de sistema operativo.

Vistas:

- `REMOTO`
- `LOCAL`
- `EN CURSO` — seguimiento guardado en el navegador.

La identidad visual mantiene el lenguaje oscuro/monocromo de JOBAS, pero toda la interacción es web convencional: menús, búsqueda, filtros, botones de acción y panel de fuentes.

Atajos:

- `/` enfoca búsqueda.
- `1` REMOTO.
- `2` LOCAL.
- `3` EN CURSO.
- `T` muestra/oculta navegación.
- `S` abre/cierra Fuentes y estado.

## Runtime

- Cloudflare Workers + Static Assets + KV.
- Sin login obligatorio.
- Sin Workers AI en el runtime.
- Cron diario existente: `15 10 * * *`.
- El MCP es stateless/read-only y no agrega polling ni loops.
- Los visitantes leen el snapshot; no disparan el radar completo.
- Fuentes automáticas: WeRemoto, Freehire, Carryer Tech, Remote OK, Remotive, Himalayas, Jobicy y We Work Remotely.

## MCP público

`POST /mcp` expone el MCP público y read-only. La entrada recomendada para agentes es `agent_bootstrap`.

El MCP puede consultar estado, oportunidades, fuentes y herramientas públicas de investigación, pero no modifica postulaciones ni dispara navegadores/crawlers en segundo plano.

## Firebase

Configuración: `firebase.json` + `.firebaserc`.

Deploy manual del alias:

```bash
npm run firebase:sites
npx --yes firebase-tools hosting:sites:create jobas --project jobas-d3c12
npm run firebase:deploy:redirect
```

## Desarrollo y verificación

```bash
npm ci
npm test
npm run dry-run
```

Deploy manual:

```bash
npm run deploy
```

GitHub Actions ejecuta tests + dry-run sobre `main` y pull requests.
