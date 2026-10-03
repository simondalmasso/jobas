# OSS Readiness

| Surface | State |
| --- | --- |
| Canonical branch | `main` |
| CI | Node tests + Wrangler dry-run + real-browser acceptance |
| Release | `v1.0.0` exact-head release |
| License | MIT |
| Security | `SECURITY.md` + CSP/HSTS/frame/MIME/referrer/permissions headers |
| MCP | Public, stateless, read-only; see `docs/MCP.md` |
| BYOK | Browser → OpenRouter; see `docs/BYOK-SMOKE.md` |
| Browser QA | Desktop 1440x900 + mobile 390x844 |
| Maintenance | Dependabot + contribution/issue templates |
| Public demo | `https://jobas.web.app` |
| Remaining blockers | None once exact-head CI, deploy and release smoke are green |

The release invariant is `main == v1.0.0 tag`. Do not move the tag after publication.
