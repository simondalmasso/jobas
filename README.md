# JOBAS

Feed público sin login para oportunidades remotas y locales, priorizado para Argentina.

Producción: https://jobas.simondalmasso44.workers.dev

## Canon

Repositorio principal: https://github.com/simondalmasso/jobas

Espejo: https://gitlab.com/simondalmasso/jobas

GitHub main es la única autoridad de código, documentación y archivos de radar. GitLab es réplica unidireccional.

Los radares GPT escriben en:

- data/gpt-local.json
- data/gpt-remoto.json

JOBAS consume esos archivos desde GitHub Raw.

## Runtime

- Cloudflare Workers + Static Assets + KV.
- Sin login, Gmail, CV/PDF, chat ni Workers AI.
- Cron diario: 15 10 * * *.
- Ocho fuentes automáticas: WeRemoto, Freehire, Carryer Tech, Remote OK, Remotive, Himalayas, Jobicy y We Work Remotely.
- Fuentes independientes y fail-isolated.
- Los visitantes leen el snapshot; no disparan el radar completo.

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
