# JOBAS Desktop + Profile + AI Interview Coach — Design

Date: 2026-10-02

## Intent

Transform JOBAS into a practical retro-desktop job workspace inspired by classic late-90s personal-computer UI patterns and the structure of spenser.xyz, without emulating an operating system. The desktop metaphor organizes real product functions: profile, searches, applications, favorites, custom folders, today's offers, personalized search, and interview training.

## Hard boundaries

- Cloudflare Worker remains the public feed/MCP/backend only.
- No AI inference, transcription, speech synthesis, or CV parsing request is proxied through JOBAS Worker.
- AI Coach connects to the user's own OpenRouter account using OAuth PKCE or a user-supplied OpenRouter API key.
- OpenRouter credential is stored browser-side only. Session storage is the default; persistent local storage is opt-in.
- Coach requests go directly from the browser to `https://openrouter.ai`.
- Audio input/output uses browser Web Speech APIs when available; text remains the universal fallback.
- Existing `data/gpt-local.json` and `data/gpt-remoto.json` remain the only radar JSON datasets.

## Information architecture

Desktop icons:
- Perfil
- Búsquedas
- Postulaciones
- Favoritos
- Carpetas del usuario

Main profile window:
- identity / headline
- target roles
- work modes: remote, local, microjobs
- location, skills, languages, notes
- completion status
- complete manually OR upload a CV

Primary actions:
- Ver ofertas de hoy
- Postular
- Entrena con IA
- Búsqueda personalizada

Secondary windows:
- Offers: existing JOBAS feed, search, filters, REMOTO / LOCAL / EN CURSO
- Applications: existing browser-local progress list
- Favorites: browser-local saved jobs
- Searches: browser-local saved searches
- Folders: browser-local user folders
- Coach: interview simulation + feedback

## Profile contract

Personalized actions require a minimally complete profile:
- name
- at least one target role
- at least one desired work mode

Public offers can still be browsed without a profile.

Manual completion writes only to browser localStorage.

CV upload:
- PDF supported through direct OpenRouter file input when the user has connected their own account.
- TXT/MD may be read client-side.
- Parsed profile is shown to the user before saving.
- Files and extracted content are never sent to JOBAS Worker.

## Coach contract

Provider: OpenRouter first-party OAuth PKCE or manual user key.

Default model: `openrouter/free`.

Coach context includes only:
- browser-local user profile;
- selected JOBAS opportunity;
- current interview chat.

Interview modes:
- mock interview
- answer coaching
- post-answer feedback

Voice:
- SpeechRecognition / webkitSpeechRecognition for microphone input when supported.
- speechSynthesis for spoken coach output when supported.
- Text mode always works.

## Security/privacy

- No provider secret embedded in source.
- No provider key sent to JOBAS endpoints.
- OAuth uses S256 PKCE + state.
- URL auth code is removed after exchange.
- "Disconnect" clears browser key material.
- Persistent key storage is opt-in and visibly labeled.
- Profile/favorites/searches/applications/folders remain browser-local in this release.

## UI

Desktop:
- blue/dithered retro background
- classic light-gray beveled windows
- navy/blue title bars
- compact taskbar
- folder/application icons
- windows are normal web panels, not OS emulation

Mobile:
- same visual identity
- windows become stacked/full-width panels
- no drag/drop dependency
- no horizontal overflow

## Non-goals

- no Windows/DOS emulation
- no user auth backend
- no InsForge database/auth in this release
- no AI bill paid by JOBAS
- no Worker AI
- no background browser agent
- no new radar JSON files
