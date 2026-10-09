# Privacy and Data Flow

JOBAS is designed so the public backend does not need a user account or a personal candidate database.

## Public data

The Worker serves:

- the public opportunity feed;
- source status;
- the public read-only MCP;
- static application assets.

## Browser-local data

The following information is stored in the user's browser:

- profile;
- target roles and work modes;
- favorites;
- saved searches;
- custom folders;
- application/in-progress tracking.

Clearing the site's browser storage removes this local workspace.

## AI Coach

JOBAS does not provide or proxy the model account.

When the user enables the Coach:

```text
user browser -> OpenRouter
```

The OpenRouter credential:

- is supplied/authorized by the user;
- is stored in session storage by default;
- may be persisted locally only when the user explicitly chooses that option;
- is never sent to a JOBAS Worker endpoint;
- is removed from both session and persistent browser storage when the user disconnects.

## Penny (optional)

Penny defaults to the same user-owned OpenRouter connection as Coach, using `openrouter/free` for text responses. Inference calls go **directly browser → OpenRouter**; the JOBAS Cloudflare Worker never receives the user's provider key or AI prompts. Free models have provider-defined usage limits and may require the user's own OpenRouter account. Hugging Face is an optional alternate provider using a separate user token directly from the browser to `router.huggingface.co`; it can consume the user's Hugging Face credits. User credentials default to session storage, persistent storage requires explicit opt-in, and disconnect removes the corresponding browser credentials.

## CV import

TXT/MD files are read in the browser.

PDF and AI-assisted profile extraction are sent directly from the browser to the provider connected by the user **only after the user explicitly chooses AI processing**. JOBAS does not upload the CV to its Worker, KV or repository. Without an AI provider configured, manual profile entry remains available; automatic extraction from uploaded CV files is not available.

## Speech

Voice input/output uses browser capabilities when available. If speech recognition is unsupported, the Coach remains usable by text. JOBAS does not run a transcription or text-to-speech service on its Worker.

## No advertising data pipeline

JOBAS does not require an advertising identifier or a user account to browse the public feed.

## Worker visibility

Because provider credentials and CV payloads never transit JOBAS endpoints, normal JOBAS Worker request logs do not contain those values.

## Operational logs

Cloudflare and other hosting/provider infrastructure may produce standard request and platform logs according to their own service configuration and policies. Do not treat JOBAS browser-local state as a server-side backup.
