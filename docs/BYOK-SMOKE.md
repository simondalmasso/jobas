# Manual BYOK Smoke

Automated CI mocks the AI provider boundary and must never consume paid/user AI.

Run this manual smoke only with a test account/credential that you control.

## OAuth path

1. Open the production JOBAS app.
2. Complete the minimum browser-local profile.
3. Open **JOBAS Coach IA**.
4. Choose **Conectar OpenRouter**.
5. Complete OpenRouter authorization and return to JOBAS.
6. Confirm the Coach reports a connected user account.
7. Send one short interview prompt.
8. Disconnect.
9. Reload the page and confirm the provider is disconnected when persistence was not explicitly enabled.

Expected:

- OAuth uses PKCE S256 and returns through the same JOBAS origin.
- A bad/missing OAuth `state` is rejected.
- Provider traffic goes directly from the browser to `openrouter.ai`.
- No provider key appears in JOBAS API requests.
- Session-only credentials disappear when the browser session storage is cleared.
- Disconnect clears both session and persistent credential slots.

## API-key path

1. Open the advanced provider section.
2. Paste a key you control.
3. Leave **Recordar en este navegador** unchecked.
4. Confirm the Coach works.
5. Close the session and confirm the key was not persisted.
6. Repeat with persistence explicitly enabled only if you want to test the opt-in path.
7. Disconnect and confirm the stored key is removed.

## CV path

Use a synthetic/non-sensitive CV.

Expected:

- TXT/MD is read in the browser.
- PDF/provider-assisted extraction is sent browser → OpenRouter.
- No CV payload is posted to a JOBAS Worker endpoint.

## Voice path

If speech recognition is available, test one microphone input and optional read-back.

If it is unavailable, JOBAS must remain fully usable by text and display the text fallback rather than fail.
