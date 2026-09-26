---
document_type: source_registry
project: jOBas
scope: remote-income-platforms
verified_at: 2026-09-22
owner: Simón Dalmasso
---

# jOBas — Verified opportunity sources

This file is a low-coupling research registry for platforms checked during the jOBas research chat.

**Meaning of VERIFIED_LEGIT:** enough evidence was found that the company/platform and the advertised work or participant program are real. It does **not** mean guaranteed acceptance, guaranteed income, or current Argentina eligibility.

## Status vocabulary

- `ARG_OK`: Argentina/global participation is supported by current primary evidence.
- `ARG_PROJECT_DEPENDENT`: global participation exists, but individual projects can restrict country/language.
- `ARG_DYNAMIC`: the platform does not publish a fixed country list; eligibility must be checked at signup.
- `ARG_PARTIAL`: only some role families are accessible internationally.
- `ARG_POSSIBLE_UNCONFIRMED`: global/South America coverage exists, but Argentina is not explicitly confirmed in public participant docs.
- `ARG_WAITLIST`: Argentina is outside the normal supported-country list but may enter a waitlist/exception flow.
- `ARG_BLOCKED`: current primary evidence excludes Argentina for the relevant worker/participant product.
- `NO_PUBLIC_ONBOARDING`: legitimate company/network, but no public self-service worker entry point was verified.

## Registry

| Platform | Legitimacy | Argentina status | Work model | Primary opportunity URL | jOBas handling |
|---|---|---|---|---|---|
| UserTesting | VERIFIED_LEGIT | ARG_DYNAMIC | Paid product/app/site testing | https://www.usertesting.com/get-paid-to-test | Keep active; validate country at signup before recommending |
| Translated | VERIFIED_LEGIT | ARG_OK | Freelance translation/localization | https://translated.com/translators | Active source for language/localization work |
| Daily Transcription | VERIFIED_LEGIT | ARG_PARTIAL | Transcription, translation, subtitling/captioning | https://dailytranscription.com/careers/ | Use mainly for Spanish translation/subtitling; do not assume general transcription eligibility |
| OneForma / Centific | VERIFIED_LEGIT | ARG_PROJECT_DEPENDENT | AI data, annotation, evaluation, localization | https://www.oneforma.com/ | High-priority active source; filter each project by country/language |
| Acolad | VERIFIED_LEGIT | ARG_POSSIBLE_UNCONFIRMED | Localization, marketing localization, creative, subtitling, AI data | https://www.acolad.com/en/about/community | Keep active; verify Argentina/project eligibility before application |
| Vidsy | VERIFIED_LEGIT | ARG_OK | Paid creator briefs: social, UGC, motion, GenAI | https://www.vidsy.co/creator | Active global creative source |
| QualRecruit | VERIFIED_LEGIT | ARG_POSSIBLE_UNCONFIRMED | Paid focus groups, interviews, surveys | https://www.qualrecruit.com/become-a-participant | Keep as secondary source; verify each study location before surfacing |
| Prolific | VERIFIED_LEGIT | ARG_WAITLIST | Paid academic/market/AI studies | https://www.prolific.com/participants | Do not present as immediately available in Argentina; monitor waitlist status |
| CloudResearch Connect | VERIFIED_LEGIT | ARG_BLOCKED | Paid online studies | https://www.cloudresearch.com/products/connect-for-participants/ | Exclude from Argentina-ready results until supported-country list changes |
| Qwick | VERIFIED_LEGIT | ARG_BLOCKED | In-person hospitality shifts in the US | https://www.qwick.com/ | Exclude from Argentina remote-work results |
| TASQ.ai | VERIFIED_LEGIT | NO_PUBLIC_ONBOARDING | Enterprise human-in-the-loop / contributor network | https://www.tasq.ai/ | Watchlist only; do not treat as an open worker marketplace |
| Carryer Tech | VERIFIED_LEGIT | ARG_PROJECT_DEPENDENT | Recruiting/job board for tech, AI, product, marketing, sales and operations roles | https://jobs.carryer.tech/ | Active discovery source; verify each role's country, English, compensation and final application rail before surfacing |

## Primary-source receipts

### UserTesting
- Participant application: https://www.usertesting.com/get-paid-to-test/application-process
- Country eligibility is dynamic rather than a published fixed list: https://participant-support.usertesting.com/hc/en-us/articles/38410176419603-Can-I-join-the-UserTesting-Network-from-my-country
- Payments are in USD through PayPal and test rewards vary by test: https://www.usertesting.com/get-paid-to-test/make-money-online
- Research note: availability depends heavily on demographics and customer demand.

### Translated
- Translator community: https://translated.com/translators
- Official signup: https://translated.com/top/sign-up
- Official page states freelancers can work from anywhere, set their own per-word rate, and are paid at month end.
- During the audited onboarding, `English (United States) → Spanish (Argentina)` was available as a language combination.

### Daily Transcription
- Careers: https://dailytranscription.com/careers/
- Official FAQ says general transcription applicants normally need to reside in the US, Canada, or native-English-speaking countries.
- The same FAQ says bilingual candidates outside the US/Canada may be considered for subtitling/captioning and translation.
- No application/start fee is required.
- Published rates are generally **per hour of source material**, not per hour actually worked; jOBas must not convert them 1:1 into hourly wages.

### OneForma / Centific
- Contributor platform: https://www.oneforma.com/
- OneForma states it supports experts in 100+ countries, shows rates before acceptance, and uses fee-free payouts.
- Availability remains project-specific; country/language restrictions must be checked on each listing.
- Treat `Centific` and `OneForma` as the same opportunity family for deduplication.

### Acolad
- Freelance community: https://www.acolad.com/en/about/community
- Official page states work-from-anywhere flexibility, 150+ nationalities, and 1,400+ language pairs.
- Relevant categories for jOBas include Marketing Localization, Creatives, Subtitling, AI Dubbing Editor, and AI Data Services.
- Do not infer translator credentials from general digital/audiovisual experience.

### Vidsy
- Creator community: https://www.vidsy.co/creator
- Official FAQ states creators can work from anywhere in the world and every creator invited to work on a brief gets paid.
- Company reports a global community of 50k+ creators across 150 countries: https://www.vidsy.co/about

### QualRecruit
- Participant page: https://www.qualrecruit.com/become-a-participant
- Official page advertises paid online focus groups/interviews/surveys and reports a $75 average project incentive and $75–$150/hour average for participants.
- Global page says it recruits consumers in 130 countries and has a network across South America: https://www.qualrecruit.com/
- Independent corporate corroboration: BBB profile for QualRecruit Inc. lists the Ottawa company and an A+ BBB rating, though it is not BBB-accredited: https://www.bbb.org/ca/on/ottawa/profile/market-research/qualrecruit-inc-0117-253910
- Argentina-specific public participant eligibility was **not** located; keep country status unconfirmed until a signup/study explicitly accepts Argentina.

### Prolific
- Participant eligibility: https://participant-help.prolific.com/en/articles/445007-who-can-participate-in-studies-on-prolific
- Waitlist: https://participant-help.prolific.com/en/articles/445008-what-is-the-sign-up-waitlist
- Argentina is not in the normal supported-country list as of this verification date.
- Prolific explicitly allows people in unsupported countries to join the waitlist and may invite some when demand matches their profile.
- Do not use VPN/location workarounds.

### CloudResearch Connect
- Participant product: https://www.cloudresearch.com/products/connect-for-participants/
- Supported locations: https://connect-researcher-help.cloudresearch.com/hc/en-us/articles/10067770591764-Participant-Targeting
- Current Connect locations are US, Canada, Australia, New Zealand, Ireland, and UK.
- Argentina is therefore not an active Connect participant country as of this verification date.

### Qwick
- Official site: https://www.qwick.com/
- Qwick is a US hospitality shift marketplace, not an international remote-work platform.
- Keep out of Argentina remote recommendations unless Qwick materially changes geography/work-authorization requirements.

### Carryer Tech
- Job board: https://jobs.carryer.tech/
- Primary board states it covers roles across the US, Europe, LatAm and remote teams worldwide, and currently exposes direct application paths through Carryer Tech, recruiting partners, or AI-training projects.
- Carryer Tech's current LinkedIn company page identifies it as a Buenos Aires recruiting company and recently announced the new jobs.carryer.tech board for LatAm, Spain, USA, programming, marketing, sales and other roles.
- Current public recruiting posts include roles explicitly open remotely from Argentina and other LATAM countries, with compensation and English level stated per role.
- Argentina eligibility is role-dependent: never infer that every board listing accepts Argentina just because Carryer Tech operates in LatAm.
- Optional paid career-support services shown on the board are separate from job applications; jOBas must not treat them as required application fees.
- Source added to the jOBas radar on **2026-09-25**.

### TASQ.ai
- Official site: https://www.tasq.ai/
- TASQ operates a real human-in-the-loop/contributor network for AI evaluation.
- No current public self-service worker marketplace, transparent contributor rate card, or Argentina onboarding route was verified.
- Keep in watchlist status rather than presenting it as immediately actionable.

## jOBas ingestion rules

1. Prefer primary sources over aggregators.
2. Re-check country eligibility and application status at the moment a lead is surfaced.
3. Never equate `VERIFIED_LEGIT` with `ARG_OK`.
4. Never advertise a platform's maximum/marketing earnings as expected income.
5. Preserve the difference between **per-hour worked**, **per-hour of media/material**, **per-word**, and **per-project** compensation.
6. Exclude pay-to-apply sources from the primary radar unless the user explicitly requests them.
7. Do not use VPNs, false demographics, false credentials, or duplicate accounts to bypass geo/profile restrictions.
8. Add new sources only with at least one primary-source receipt plus an explicit Argentina-access status.
9. Re-verify stale entries before use if the last verification is older than 60 days or the platform has changed onboarding/payments.

## Provenance

Research consolidated from the jOBas opportunity-verification chat and rechecked against primary web sources on **2026-09-22**. This registry is intentionally under `docs/research/` so it remains documentation-only and does not couple to application/runtime architecture.


### Registry update 2026-09-25
- Added Carryer Tech (`https://jobs.carryer.tech/`) as an active remote-job discovery source after current primary-site and company-identity verification.
