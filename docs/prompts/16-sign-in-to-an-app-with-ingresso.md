# Journey 16: Sign in to an app with ingresso

## Goal

A person chooses **Sign in with ingresso** in one of the owner's apps. If they already have an ingresso
session they come straight back to the app, signed in. If not, they see ingresso's sign-in page, which names
the app, request an email link, open it, and land back in the app signed in. The app receives an ID token
with the person's subject id and verified email address.

- Detailed design: `docs/detailed-designs/identity-provider/` (the folder named in Phase 4)
- Requirements: the new L2 entries Phase 3 adds to `docs/specs/L2.md`, plus the cross-cutting ones the design cites.
- Journey: 16 in `docs/journey.md`.
- Prerequisites: `docs/prompts/00-scaffold.md` and journeys 01–15 are merged to `main`.
- Unchanged: Signing in to ingresso itself (journey 01) and its dashboard.

### What exists today

Journey 15 registered clients through OpenIddict but added no endpoints. `RequestSignInLink` in
`backend/src/Ingresso.Application/Identity/` accepts a local redirect path, and `AuthController.Redeem`
redirects to it after starting the session. This journey adds the discovery document, JWKS, `authorize` and
`token` endpoints, signing and encryption keys (from configuration or a certificate in production, and
development keys locally), and the sample relying party `backend/samples/Ingresso.SampleApp`: a minimal
ASP.NET Core app using `AddOpenIdConnect`, registered by `seed` in Development, for tests and demos.

## Finish the whole journey in one run. Do not stop. (CRITICAL)

- You are authorised to take this journey all the way: align the mocks, design system, requirements and design; implementation; a narrated demo video; a pull request with green checks; and the merge. Go through every phase and every slice in one
  continuous run. Do not pause between phases to report, ask for approval, or wait for "continue".
- Do not end your turn until the "Done means" list at the bottom is fully true. A partial result, a plan, or
  "the next steps would be..." is not done.
- Where `AGENTS.md` says "stop and ask", treat this prompt as the confirmation in advance for everything in
  scope here. Choose the simplest option that fits the existing architecture, record it (an architecture
  decision record in `docs/adr/` or the detailed design's open-questions section), and keep going.
- If the `components` library lacks something, that is not a reason to stop. Update the design system
  catalogue (`docs/design-system/`) and the library first, as the project rules require, then go on.
- When a test, build or command fails, find the root cause and fix it, then go on. Never weaken a test to make
  it pass, and never skip a step quietly.
- Only stop for a real blocker you cannot resolve yourself, such as missing credentials, a download that needs
  a human, or branch protection that needs a human review. If that happens, finish everything else first, then
  report the blocker clearly.
- Keep track of progress (a todo list), so that nothing gets left out after context is summarised.

## Rules (read first, binding)

- Follow `AGENTS.md` exactly, especially:
  - The mandatory folder structure. Don't add top-level folders or projects without updating its tree.
  - Strict backend layering: Domain, Application, Infrastructure, Api, Cli. Business rules in handlers and
    domain, never controllers. The API never migrates on startup; the CLI `migrate` command does.
  - Backend acceptance tests are API integration tests in `backend/tests/Ingresso.Api.Tests` on per-fixture in-memory
    SQLite. No database server. API tests run sequentially.
  - Frontend acceptance tests are Playwright with the Page Object Model: one page object per screen in
    `frontend/e2e/pages/`, tests in `frontend/e2e/tests/`, never a selector in a test. Chromium only.
  - The `components` library is mandatory (`ig-*` selectors, Fluent UI v9 tokens read by role, BEM classes
    from the mocks). `docs/screen-composition.md` is binding: build each screen from exactly the components its
    entry lists, and build locally only what it marks as local. A new component gets its Storybook story folder
    and a perf-test scenario.
  - Pages depend on API injection tokens, not concrete services. Editing opens a CDK Dialog (with
    `DialogShell`) or a screen, never an inline form. Toasts go through `ToastService`.
  - Declare each `ng-content` slot once. Run `npm run tokens` after changing the token theme.
  - Prettier and angular-eslint must pass (`npm run lint`, `npm run format:check` in `frontend/`).
  - Acceptance tests start with `// Acceptance Test`, `// Traces to: L2-nnn`, `// Description: ...`.
  - Never write architecture tests. Never weaken a test.
- Identity-provider rules for this journey and every one after it (15–27):
  - The OpenID Connect server is OpenIddict, as recorded in the ADR that journey 15 adds. Never hand-roll
    protocol endpoints, token formats or cryptography; configure the library and test the behaviour.
  - Authorization code with PKCE is the only interactive flow. No implicit flow, no password grant.
  - Redirect and sign-out addresses match a registered address exactly. An unknown client or address shows
    an ingresso error page and never redirects.
  - Tokens, secrets and codes never appear in logs (L2-038). Client secrets are stored hashed and shown once.
  - Protocol behaviour is proven with API integration tests in `backend/tests/Ingresso.Api.Tests` that drive
    the endpoints over HTTP. Browser journeys are proven with Playwright against the sample relying party
    `backend/samples/Ingresso.SampleApp` (added by journey 16), through a page object for each of its screens.
- Invoke and follow `implementing-incrementally` before any code, with ATDD for every slice.
- If something seems to need more scope, leave it out, note it as deferred, and continue.
- If this journey needs behaviour from a journey later in `docs/journey.md`, depend on an interface or seam
  and leave that behaviour to its own journey. Do not build it here.
- Work through the phases below **in order**, using the skill each phase names.
- Copy the house style of each folder. Read the existing neighbours before you write anything new.

## Start

- `git checkout main && git pull`, then `git checkout -b journey/16-sign-in-to-an-app-with-ingresso`.

## Phase 1: Mocks (`writing-html-mocks`)

- Add a `for-app` state to `docs/mocks/pages/sign-in/` that names the app the person is signing in to,
  and its `sent` variant.
- Add `docs/mocks/pages/authorize-error/` for an unknown app or an unregistered address (default), with
  no link back to the app.
- Light and dark, at phone, tablet and desktop widths. Update the manifest, gallery and coverage matrix.

## Phase 2: Design system (`extracting-design-systems`, `writing-screen-composition`)

- Check the design system covers both screens; the error page should be a `StatusPage` variant. Add only
  what is missing.
- Update `docs/screen-composition.md` for the sign-in `for-app` state and the authorize error page.

## Phase 3: Requirements (`writing-requirements`)

- Add L2 requirements (next free number after the highest in `docs/specs/L2.md`) for: discovery and JWKS;
  authorization code with PKCE (S256 only); an existing session skips sign-in; an anonymous person signs in
  by email link and returns to the authorize request; unverified accounts cannot sign in to apps until they
  verify (cross-reference L2-029); exact redirect matching; single-use, short-lived codes; ID token claims
  `sub` and `email`; errors for unknown clients and addresses.
- Cross-reference L2-027, L2-028, L2-030 and L2-036 (rate limiting) instead of copying them.

## Phase 4: Detailed design (`writing-design-documents`)

- Add `docs/detailed-designs/identity-provider/sign-in-to-an-app/`. Cover the OpenIddict server and
  validation setup in Infrastructure and Api, the authorize passthrough that reuses the cookie session, the
  return to the authorize request after the email link, key management, the sample app, and sequence
  diagrams for the signed-in and anonymous paths.
- Update `docs/detailed-designs/identity/sign-in-with-email-link/` only where the return path changes.
- Add `backend/samples/` and the sample app to the `AGENTS.md` folder tree and to `Ingresso.sln`.

## Phase 5: Estimate (`estimating-designs`)

- Add the design to `docs/estimates/` at 0% (a `identity-provider.md` table if it does not exist yet, and a row in the
  root README) before you start, and update it at the end with the true percent complete.

## Phase 6: Incremental implementation (ATDD)

- Read the existing code and tests first. Keep what already meets the requirements, and close the gaps test-first. Do not rebuild what works.
- Plan thin vertical slices, for example:
  1. Discovery document and JWKS are served; an API test reads them.
  2. With a session, `authorize` + `token` with PKCE return an ID token for the client; wrong verifier, reused code and unregistered address fail.
  3. Without a session, `authorize` sends the person to sign-in naming the app; redeeming the email link returns to the authorize request and on to the app.
  4. Playwright: the sample app's Sign in with ingresso, end to end in Chromium, signed in and anonymous; the authorize error page.
- For each slice:
  - Write the Given-When-Then criteria from the requirement.
  - Write the acceptance test (API integration test or Playwright with a page object), traced to the
    requirement.
  - Run it and show it fails for the expected reason. If an existing test already covers the criterion and
    passes, show that instead, and make sure it carries the trace header.
  - Implement the minimum that makes it pass, and refactor while green.
  - Run the regression checks, then commit.
- Add Playwright visual baselines for any new or changed ingresso screens and states, compared against the mocks.
- When all slices are green, keep the mocks, design system, screen composition, design and estimate aligned with what was built.

## Phase 7: Narrated demo video (`recording-demo-videos`)

Follow the skill, with these overrides:

- Use the demo tooling under `frontend/e2e/demo/` (added by `00-scaffold`). Do not use edge-tts.
- Run the app, the API and (from journey 16 on) the sample app locally against the seeded SQLite database, as
  Playwright does. If ports 4200 or 5100 are taken by another project, use free ports instead; never stop a
  process this run did not start.
- Storyboard (adjust to what was built; show only what works):
  1. The sample app with its Sign in with ingresso button.
  2. ingresso's sign-in page naming the app.
  3. The email link in the development mailbox.
  4. Back in the sample app, signed in, showing the person's email.
  5. A second sign-in that goes straight through because the session exists.
- Drive it with `frontend/e2e/demo/journeys/16-sign-in-to-an-app-with-ingresso.ts` in Chromium. Terminal beats may be captured from a
  terminal rendered in the browser. Take a screenshot at each beat at 1280 × 720, light theme. Add a
  dark-theme or phone-width shot where the mocks differ. Save them as
  `docs/demos/16-sign-in-to-an-app-with-ingresso/screenshots/NN-beat-name.png`.
- Write one short narration paragraph per screenshot: second person, warm, plain, no jargon. Open with what
  "Sign in to an app with ingresso" lets you do, close with a one-line recap. Save it as `docs/demos/16-sign-in-to-an-app-with-ingresso/narration.md`.
- Voice: synthesize the narration with Kokoro-82M (`hexgrad/Kokoro-82M` from Hugging Face) run locally, voice
  `af_heart` at normal speed.
- Video: build it from the screenshots. Hold each for its narration plus 0.6 s, with 0.4 s crossfades and a
  slow, gentle zoom. H.264 + AAC MP4 at 1280 × 720.
- Music: the upbeat soca track from Pixabay in `frontend/e2e/demo/music/`. Loop or trim it to length, fade in
  over 1 s and out over 2 s, and duck it under the voice (sidechain compression). Voice around -16 LUFS, music
  well below it, so every word is clear.
- **No captions.** No burned-in subtitles, no on-screen caption overlay, no `.vtt` or `.srt`, no `<track>`.
- Verify: `ffprobe` shows one video and one audio stream and the duration you expect; `ebur128` loudness is in
  range; look at three extracted frames and confirm there is no caption text.
- Save `docs/demos/16-sign-in-to-an-app-with-ingresso/demo.mp4` (tracked with Git LFS) and `credits.md` (voice model and its licence;
  music title, artist, Pixabay URL and the Pixabay Content License).

## Phase 8: Pull request

- Run the full regression: `dotnet build Ingresso.sln && dotnet test`, and in `frontend/`: `npm run lint`,
  `npm run format:check`, `npm run tokens:check`, `npm run build`, `npm run build-storybook`, and the
  Playwright suite in Chromium (`npm run e2e`) including visual regression.
- `git fetch origin && git rebase origin/main`, then push the `journey/16-sign-in-to-an-app-with-ingresso` branch.
- `gh pr create --base main --title "feat(identity-provider): sign in to an app with ingresso"`. In the body: what the user can now do, the requirements
  covered, the tests added, decisions made, anything deferred, and the path to `docs/demos/16-sign-in-to-an-app-with-ingresso/demo.mp4`
  in the branch.
- `gh pr checks --watch`. If a check fails, fix the cause, push, and watch again.

## Phase 9: Merge

- When every check is green, merge: `gh pr merge --squash --delete-branch`. This prompt authorises the merge.
- `git checkout main && git pull`, then build once more to confirm main is green.
- If branch protection needs a human review, report that as the blocker with the PR link.

## Deferred

- Access tokens for app APIs (journey 17).
- Signing out of apps (journey 18).
- Refresh tokens (journey 20).
- Profile claims beyond `sub` and `email` (journey 22).
- Consent (journey 23).

## Done means

- A person signs in to a registered app with ingresso, through an existing session or an email link, as the requirements state.
- All new and existing tests pass, in Chromium only.
- The documentation agrees with the code: mocks, design system, screen composition, requirements, design and
  estimate.
- `docs/demos/16-sign-in-to-an-app-with-ingresso/demo.mp4` is narrated with the Kokoro voice, has soca music under it, and has no
  captions.
- The pull request is merged to `main` with green checks, and `main` builds.
- Only then end the run, with a short summary of what was built, the decisions made, the PR link, and anything
  deferred.
