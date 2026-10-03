# M8ven Trust Index

External trust signal for the public JOBAS MCP. This file records observed state; it is not a substitute for JOBAS tests, CI, source review or security policy.

- Observed: 2026-10-03
- Listing: https://m8ven.ai/mcp/simondalmasso/jobas
- Repository: https://github.com/simondalmasso/jobas
- Trust score: 74/100
- Verdict: Caution
- Code sub-score: 100/100
- Maintenance: live
- Freshness: fresh
- Top findings: none reported by the M8ven ToolCheck surface at observation time
- Publisher claim: owner-initiated; verification pending until M8ven confirms it
- Live monitoring: not connected

## Meaning

M8ven is an external scanner/index. Its score is one independent signal, not a JOBAS release gate by itself and not proof that the software is secure.

The current result has no concrete findings exposed by the ToolCheck surface. JOBAS should not change code merely to optimize this score. Any future finding must be reproduced or otherwise substantiated before changing product behavior.

## Publisher badge

README uses M8ven's standard live badge endpoint:

```markdown
[![M8ven Score](https://m8ven.ai/badge/mcp/simondalmasso/jobas)](https://m8ven.ai/mcp/simondalmasso/jobas?s=readme)
```

Do not describe JOBAS as a "Verified Publisher" until M8ven's public listing actually reports that state.

## Connect Live guardrail

Connecting M8ven is optional. If enabled, it must be scoped only to `simondalmasso/jobas` and must remain read-only.

M8ven's public data-handling page states that its GitHub App is read-only and repository-selective. It describes:
- Monitor: metadata and dependency information only.
- Verify: adds read access to repository file contents.

Source: https://m8ven.ai/connect/data-handling

If the GitHub installation screen requests write permissions or broader repository access than `simondalmasso/jobas`, stop and do not authorize it.
