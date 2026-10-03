# Contributing to JOBAS

JOBAS is intentionally small. Changes should keep the product understandable, cheap to run and safe to operate.

## Development

Requirements:

- Node.js 22+
- npm
- a Cloudflare account only when deploying

Setup:

```bash
npm ci
npm test
npm run dry-run
```

Local development:

```bash
npm run dev
```

## Pull requests

Keep pull requests focused and include:

1. what changed;
2. why it changed;
3. how it was verified;
4. screenshots for visible UI changes.

Before opening a PR:

```bash
npm run verify
```

## Project invariants

Please preserve these constraints:

- GitHub `main` is the canonical source.
- `data/gpt-local.json` and `data/gpt-remoto.json` are the only radar JSON datasets.
- the public Worker must remain usable without login;
- AI coaching must use the user's own provider connection directly from the browser;
- do not proxy AI inference, transcription or speech through the JOBAS Worker;
- do not commit secrets, provider keys, browser sessions or personal CV data;
- do not add background polling, browser agents or expensive runtime dependencies without an explicit architectural decision;
- preserve the public read-only MCP contract.

## Style

Prefer plain JavaScript, small modules, native browser APIs and explicit tests over framework/runtime expansion.

Powered by GPT + GitHub + Cloudflare.
