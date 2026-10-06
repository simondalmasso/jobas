# M8ven Trust Index

External trust signal for the public JOBAS MCP. This file records observed state; it is not a substitute for JOBAS tests, CI, source review or security policy.

- Observed: 2026-10-06
- Listing: https://m8ven.ai/mcp/simondalmasso/jobas
- Repository: https://github.com/simondalmasso/jobas
- ToolCheck trust score: 89/100
- ToolCheck verdict: Caution
- ToolCheck reason: Code clean and publisher verified, but no adoption track record yet
- Code sub-score: 100/100
- Maintenance: live
- Freshness: fresh
- Top findings: none exposed by the M8ven ToolCheck surface at observation time
- Publisher claim: confirmed
- Publisher status: Verified Publisher
- Live monitoring: connected
- GitHub App repository scope: only `simondalmasso/jobas`
- GitHub App permissions observed in GitHub: read access to Dependabot alerts, code, and metadata; no write permission shown

## Meaning

M8ven is an external scanner/index. Its score is one independent signal, not a JOBAS release gate by itself and not proof that the software is secure.

The current ToolCheck result exposes no concrete findings. JOBAS should not change code merely to optimize this score. Any future finding must be reproduced or otherwise substantiated before changing product behavior.

M8ven surfaces can update asynchronously. At the observation above, ToolCheck had moved to 89/100 while the public listing page still displayed its earlier 74/100 snapshot and commit `7352c3d`. That presentation lag is recorded rather than reconciled by assumption.

## Publisher badge

README carries the publisher-verification badge supplied by M8ven:

```markdown
[![M8ven Score](https://m8ven.ai/badge/mcp/simondalmasso-jobas-17b8z9?v=07bfd6c708387e86bfdce7b7402cd8aa)](https://m8ven.ai/mcp/simondalmasso-jobas-17b8z9?s=readme)
```

The public listing now reports `simondalmasso · Verified Publisher`.

## Connect Live

M8ven Verify is installed as a GitHub App with repository access restricted to `simondalmasso/jobas`.

GitHub showed:
- **Repository access:** Only select repositories → `simondalmasso/jobas` (1 repository).
- **Permissions:** Read access to Dependabot alerts, code, and metadata.
- **Write permissions:** none shown.

After saving that scope, M8ven reported `⚡ Live Monitored` and stated that the repository will be re-verified automatically on code changes.

If the installation ever requests write access or expands beyond `simondalmasso/jobas`, stop and review the integration before accepting the change.
