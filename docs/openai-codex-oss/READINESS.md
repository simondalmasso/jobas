# OSS Readiness

| Surface | State |
| --- | --- |
| Canonical branch | `main` |
| CI | Node tests + Wrangler dry-run + browser acceptance |
| Release | `v1.0.0` required at verified exact head |
| License | MIT |
| Security | `SECURITY.md` + strict browser headers |
| MCP | Public, stateless, read-only; see `docs/MCP.md` |
| Browser QA | Desktop 1440x900 + mobile 390x844 |
| Maintenance | Dependabot + contribution/issue templates |
| Public demo | `https://jobas.web.app` |
| Remaining blockers | Track only verified failures here |

Release readiness requires `main == v1.0.0 tag`, CI green, production smoke green and zero browser console errors in the acceptance gate.
