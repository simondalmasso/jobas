# Security Policy

## Supported version

Security fixes are applied to the current `main` branch and the production deployment.

## Reporting

Do not publish secrets, API keys, personal CV data or exploitable details in a public issue.

If GitHub private vulnerability reporting is available for this repository, use it. Otherwise, open a minimal issue requesting a private contact channel without including exploit details or sensitive material.

## Security model

JOBAS deliberately keeps a narrow trust boundary:

- the public Cloudflare Worker serves the app, feed and read-only MCP;
- profile, favorites, searches, folders and application tracking are browser-local;
- OpenRouter credentials belong to the user and remain browser-side;
- AI requests go directly from the user's browser to OpenRouter;
- CV processing is never proxied through the JOBAS Worker;
- no provider secret is embedded in the repository;
- OAuth uses PKCE S256 plus `state` verification;
- provider credentials default to `sessionStorage`, persistent storage is explicit opt-in, and disconnect clears both stores;
- security headers include CSP, HSTS, frame denial, nosniff, referrer policy and permissions policy.

Never commit:

- `.env` / `.dev.vars`;
- API keys or OAuth secrets;
- browser cookies or session storage exports;
- personal CVs or candidate data;
- Cloudflare, GitHub, Firebase or OpenRouter credentials.

See [docs/PRIVACY.md](docs/PRIVACY.md) for the data-flow model and [docs/MCP.md](docs/MCP.md) for the public read-only MCP contract.
