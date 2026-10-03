# JOBAS Desktop + Profile + Coach — Implementation Plan

Execution: native, current session.

## Card 1 — Pure browser state
Create `public/profile.js` for profile normalization/completion/storage contracts and `public/user-memory.js` for favorites/searches/folders. Tests first.

Acceptance:
- incomplete/complete profile behavior is deterministic;
- storage adapters can run with fake Storage in Node tests;
- no network dependency.

## Card 2 — OpenRouter-owned AI boundary
Create `public/coach.js`.

Interfaces:
- `createPkcePair()`
- `buildOpenRouterAuthUrl(...)`
- `exchangeOpenRouterCode(...)`
- `getStoredCredential(...)`
- `disconnectProvider(...)`
- `sendCoachMessage(...)`
- `extractProfileFromCv(...)`
- `createSpeechController(...)`

Acceptance:
- auth URL uses OpenRouter + S256 + state;
- exchange/chat/CV calls target openrouter.ai only;
- no JOBAS /api route is used for AI;
- manual key is browser-owned;
- speech controller fails gracefully if unsupported.

## Card 3 — Retro desktop UI
Replace the current shell with a spenser-inspired desktop in `public/index.html` + `public/styles.css`.

Acceptance:
- icons for Profile/Searches/Applications/Favorites;
- primary window includes required profile and four primary actions;
- coach window exposes provider connect/disconnect, model, interview target, chat, text send, mic, speak toggle;
- responsive 390px without horizontal overflow;
- no fake OS boot/command shell.

## Card 4 — Integrate existing JOBAS feed
Refactor `public/app.js` to preserve:
- /api/feed loading;
- REMOTO / LOCAL / EN CURSO;
- filters;
- progress tracking;
- CV adaptation/apply actions.

Add:
- favorites;
- personalized local filtering;
- saved searches;
- custom folders;
- profile gating;
- coach selected-job context.

Acceptance:
- existing feed workflow remains operational;
- personalized search uses profile only in browser;
- public browsing still works without profile.

## Card 5 — CV → profile + coach runtime
Wire PDF/TXT upload to browser/direct OpenRouter path and profile review.

Acceptance:
- no upload request reaches JOBAS Worker;
- extracted profile is editable before save;
- useful error if no provider is connected.

## Card 6 — Verification and release
- full `npm test`
- `npm run dry-run`
- desktop/mobile rendered smoke test
- inspect network code for AI boundary
- README architecture/privacy update
- PR + merge + deploy only after green evidence
