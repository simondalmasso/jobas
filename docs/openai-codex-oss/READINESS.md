# JOBAS — Open Source Submission Readiness

LAST_CHECK=2026-10-09
OSS_SUBMISSION=GO_FOR_OWNER_SUBMISSION
APPLICATION_STATUS=NOT_SUBMITTED
RELEASE=v1.1.2
RELEASE_COMMIT=a7dedb672674f0513621fef247e561deda00b354
PRODUCTION_WORKER_VERSION=d53a54a2-b70e-4e89-a3fc-6bfd696ff533
RELEASE_PRODUCTION_ACCEPTANCE=PASS
CANONICAL_REPOSITORY=https://github.com/simondalmasso/jobas-latam-job-search

## Verifiable evidence

- **Public MIT repository**, primary maintainer `simondalmasso`; no claim of widespread adoption or established usage metrics.
- **Release:** [JOBAS v1.1.2](https://github.com/simondalmasso/jobas-latam-job-search/releases/tag/v1.1.2) is published (not draft/prerelease). Its annotated tag points to commit `a7dedb672674f0513621fef247e561deda00b354`.
- **CI:** [main release-commit verify](https://github.com/simondalmasso/jobas-latam-job-search/actions/runs/37961659852) passed. Local `npm ci`, `npm run verify`, and `npm audit` passed; the release-candidate test suite had 78 passing Node tests.
- **Cloudflare:** Worker version `d53a54a2-b70e-4e89-a3fc-6bfd696ff533` was deployed at 100% and tested against live production, including 1440px desktop and 390px/360px mobile Chromium, zero console errors, local/remote radar, browser-local profile and saved state, and public read-only MCP. Feed and health agreed at **345** during the v1.1.2 release verification; four compatible LOCAL opportunities rendered and no `&amp;` query separators remained.
- **Feed evidence:** [46-link deterministic sample](FEED_SAMPLE_2026-10-09.json) across 10 sources had 31 visible listing-text matches, 2 HTTP-reachable but unconfirmed listings, and 13 blocked/inaccessible endpoints; a transport success is never asserted to prove a vacancy is actively recruiting.
- **Privacy and boundaries:** user profiles, CV and saved state are browser-local; optional user-owned OpenRouter AI is browser-to-provider (not through JOBAS Worker); the Worker has no privileged application-submission tool.

## Release identity and subsequent commits

`v1.1.2` is an immutable tag pinned to release commit `a7dedb672674f0513621fef247e561deda00b354`. The deployed Cloudflare Worker version `d53a54a2-b70e-4e89-a3fc-6bfd696ff533` serves the verified v1.1.2 browser assets; the previous v1.1.1 version remains available for rollback. A later documentation-only commit on `main` does not change the release SHA or production artifact.

**Penny provider caveat:** OpenRouter's `openrouter/free` endpoint is called directly from the user's browser after explicit OpenRouter authorization, with no intermediary Cloudflare inference call. A mocked provider reply passed UI regression tests, but an authenticated live model reply using the owner's credentials has **not** been observed. Free-model access remains subject to provider/account limits; Hugging Face is opt-in with separate credits.

## Explicit limitations

- **Vacancy status:** individual jobs are not continuously revalidated; age, unknown geography and inaccessible links remain labelled as such. The 46-link audit is bounded evidence, not an exhaustive availability guarantee.
- **AI:** full OpenRouter-authenticated model calls and AI-assisted CV extraction were not tested with private owner credentials. The public product remains usable in the disconnected state.
- **Accessibility:** responsive tests at three viewport sizes and browser smoke do not substitute for a full keyboard/screen-reader audit.
- **Billing:** Workers Free may cover base usage if account limits permit, but actual Cloudflare recurring spend is not independently reconciled.
- **Adoption:** the public GitHub repository currently has no demonstrated ecosystem-scale usage; do not invent stars, downloads, external users, institutional support, or selection by OpenAI.

## Owner submission

Apply at <https://openai.com/form/codex-for-oss/>. The official form allows a maximum of **500 characters** for each of three narrative answers (repository eligibility, proposed API-credit use, additional context). Primary maintainer must provide/confirm their ChatGPT email, GitHub identity, OpenAI organization ID, and accept the program terms.

**Decision:** `OSS_SUBMISSION=GO` for the *owner to submit*, without asserting acceptance or benefit eligibility is guaranteed. Program selection is OpenAI's decision. This is not a release gate for future code changes.
