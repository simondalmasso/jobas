# JOBAS

JOBAS es un radar público de oportunidades para Argentina/LatAm y un escritorio personal para organizar la búsqueda laboral, seguimiento, favoritos y preparación de entrevistas.

## Acceso público

- Aplicación / backend canónico: https://jobas.simondalmasso44.workers.dev
- MCP público: https://jobas.simondalmasso44.workers.dev/mcp
- Alias Firebase: https://jobas.web.app

Cloudflare Workers sigue siendo el único runtime de JOBAS. Firebase Hosting se usa únicamente como alias/redirección; no duplica backend, datos ni lógica.

## Canon

Repositorio principal: https://github.com/simondalmasso/jobas

Espejo: https://gitlab.com/simondalmasso/jobas

`GitHub/main` es la autoridad de código, documentación y configuración de JOBAS.

## Datos de radar

JOBAS conserva únicamente dos archivos JSON de radar:

- `data/gpt-local.json` — oportunidades locales/presenciales.
- `data/gpt-remoto.json` — oportunidades remotas.

No se agregan datasets de radar nuevos para memoria, perfil o Coach. Esa información vive en el navegador del usuario.

## Escritorio personal

La interfaz usa una metáfora de escritorio retro, sin emular un sistema operativo ni incluir consola/boot falsos.

Áreas principales:

- Perfil.
- Búsquedas guardadas.
- Postulaciones.
- Favoritos.
- Carpetas personalizadas.
- Ofertas de hoy.
- Búsqueda personalizada.
- JOBAS Coach IA para entrevistas.

El perfil se puede completar manualmente o desde un CV. Para personalización mínima requiere:

- nombre;
- al menos un objetivo laboral;
- al menos una modalidad: remoto, local/presencial o microjobs.

Perfil, favoritos, búsquedas, carpetas y seguimiento se guardan browser-side.

## Ofertas y seguimiento

Vistas del feed:

- `REMOTO`
- `LOCAL`
- `EN CURSO`

Se mantienen los flujos existentes de aplicación:

- vacantes tradicionales: seguimiento + preparación de CV + aplicación;
- microjobs/Telegram/directos: contacto directo, sin forzar CV;
- plataformas como Workana/Upwork: flujo de propuesta, sin forzar CV.

La búsqueda personalizada filtra el feed ya cargado usando el perfil local del usuario; no dispara un crawler ni una búsqueda externa desde el Worker.

## JOBAS Coach IA

El Coach permite:

- simulación de entrevista;
- entrenamiento de respuestas;
- feedback posterior;
- texto;
- entrada por voz cuando el navegador soporta `SpeechRecognition`;
- lectura de respuestas mediante `speechSynthesis`.

Proveedor actual: OpenRouter.

### Frontera de costo y privacidad

El Coach **no usa Workers AI ni consume inferencia desde JOBAS**.

Flujo:

```text
navegador del usuario -> OpenRouter
```

No:

```text
navegador -> JOBAS Worker -> proveedor IA
```

El usuario conecta su propia cuenta mediante OAuth PKCE o puede usar su propia API key.

- OAuth usa PKCE S256 + `state`.
- La credencial queda en `sessionStorage` por defecto.
- Persistencia en `localStorage` es opt-in.
- Desconectar elimina las credenciales browser-side.
- Las llamadas del Coach y el procesamiento de CV van directamente a `https://openrouter.ai`.
- `src/` no contiene integración con OpenRouter, chat completions, transcripción ni voz.
- JOBAS no paga ni intermedia el consumo IA del usuario.

Para PDF, JOBAS usa el soporte de file input de OpenRouter desde el navegador del usuario. TXT/MD se leen localmente antes de enviarlos al proveedor elegido por el usuario.

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
