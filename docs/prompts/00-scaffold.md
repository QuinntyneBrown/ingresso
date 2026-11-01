# Scaffold: ingresso solution baseline

## Goal

Bring the ingresso solution to the baseline every journey prompt in `docs/prompts/` starts from. Much of the
scaffold already exists in the working tree: the .NET solution (`Ingresso.sln`, five `src/` projects and their
test projects), the Angular workspace in `frontend/` (`ingresso`, `api`, `components`, `perf-test`), Storybook,
Playwright, CI (`.github/workflows/ci.yml`), and early versions of the dashboard. It has never been committed,
it creates its database with `EnsureCreated` instead of migrations, it has no demo-video tooling, and
`docs/estimates/` is empty. After this run `main` holds a building, migrating, seeding solution with green CI,
the platform requirements below are met, and the demo tooling works.

- Detailed designs: `docs/detailed-designs/platform/` (all six) and the system architecture in
  `docs/detailed-designs/README.md`.
- Requirements: L2-033, L2-034, L2-035, L2-036, L2-037, L2-038, L2-039, L2-043, L2-045, L2-047, L2-048, L2-049,
  L2-050 in `docs/specs/L2.md`.
- Mocks: `docs/mocks/pages/not-found/`, `docs/mocks/pages/forbidden/`, `docs/mocks/pages/server-error/`,
  `docs/mocks/pages/offline/`, `docs/mocks/notifications/app-toast/`, `docs/mocks/notifications/status-banner/`.
- Journeys that follow: `docs/journey.md`, prompts `01` to `14` in this folder.

## Finish the whole scaffold in one run. Do not stop. (CRITICAL)

- You are authorised to take this scaffold all the way: the first commit; the platform slices; migrations; estimates; demo-video tooling; a narrated demo video; a pull request with green checks; and the merge. Go through every phase and every slice in one
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
- Invoke and follow `implementing-incrementally` before any code, with ATDD for every slice.
- If something seems to need more scope, leave it out, note it as deferred, and continue.
- If this scaffold needs behaviour from a journey later in `docs/journey.md`, depend on an interface or seam
  and leave that behaviour to its own journey. Do not build it here.
- Work through the phases below **in order**, using the skill each phase names.
- Copy the house style of each folder. Read the existing neighbours before you write anything new.

## Start

- The repository has no commits yet and `origin` is `https://github.com/QuinntyneBrown/ingresso.git`.
- Check `.gitignore` covers `bin/`, `obj/`, `node_modules/`, `test-results/`, `playwright-report/`, local
  databases and `.env` files, and that no secret is in the tree. Then make the first commit of the working tree
  on `main` and push it: `git add -A && git commit -m "chore: initial ingresso solution"` and
  `git push -u origin main`. This prompt authorises that push.
- `git checkout -b journey/00-scaffold`.

## Phase 1: Solution baseline

- `dotnet build Ingresso.sln && dotnet test` and, in `frontend/`, `npm ci`, `npm run lint`,
  `npm run format:check`, `npm run tokens:check`, `npm run build`, `npm run build-storybook` all pass. Fix
  the root cause of any failure. `ng build components` (ng-packagr) currently fails on SCSS include paths:
  fix it.
- Replace `EnsureCreated` with EF Core migrations: an initial migration in `Ingresso.Infrastructure` for the
  current model, the CLI `migrate`, `seed` and `reset` commands working on SQL Server and SQLite. Drop the
  obsolete `Tile.SortOrder` and `Tile.Size` columns now that placement is `X`, `Y`, `Cols`, `Rows`.
- Playwright: the global setup starts the API on a migrated, seeded SQLite database and the app with its
  proxy. Make the ports configurable (`PW_BASE_URL`, API port) so a run never needs ports another project is
  using.
- CI on every PR: `dotnet build`, `dotnet test`, lint, format check, `tokens:check`, `build-storybook`, and
  Playwright in Chromium. Git LFS for `*.mp4` in `.gitattributes`.
- Make the root `README.md` true: prerequisites, commands, npm script names, and the CI badge. Commit.

## Phase 2: Docs alignment

- Check `docs/screen-composition.md` (`writing-screen-composition`) against the mocks and the library.
- Create `docs/estimates/` (`estimating-designs`): every design with its true percent complete.

## Phase 3: Incremental implementation (ATDD)

- Read the existing code and tests first. Keep what already meets the requirements, and close the gaps
  test-first. Do not rebuild what works.
- Plan thin vertical slices, for example:
  1. CLI `migrate`, `seed` (idempotent) and `reset` (needs a confirmation flag), non-zero exit on failure
     (L2-049).
  2. The API never migrates on startup and warns about pending migrations (L2-050).
  3. Problem details for validation and unhandled errors, with a correlation id and no stack trace (L2-048).
  4. Request logging outside the exception middleware, with the handled status, method, path, duration and
     correlation id, and no personal data (L2-047, L2-038).
  5. Authentication required everywhere except sign-in and health; the app redirects to sign-in (L2-033).
  6. CSRF protection on every state-changing request (L2-034).
  7. Security headers and a CSP with no inline script (L2-035); user text always rendered as text (L2-037).
  8. Rate limiting per session with `Retry-After` (L2-036).
  9. Status pages: not found, forbidden, server error and offline, from `StatusPage` (screen composition).
  10. Shell: skip link first, visible focus, dialogs that trap and restore focus, toasts announced, header
      menu at phone width and 44 px touch targets (L2-043, L2-045).
  11. API p95 under 200 ms with 200 tiles (L2-039), as an opt-in performance test.
- For each slice:
  - Write the Given-When-Then criteria from the requirement.
  - Write the acceptance test (API integration test or Playwright with a page object), traced to the
    requirement.
  - Run it and show it fails for the expected reason. If an existing test already covers the criterion and
    passes, show that instead, and make sure it carries the trace header.
  - Implement the minimum that makes it pass, and refactor while green.
  - Run the regression checks, then commit.

## Phase 4: Demo-video tooling (`recording-demo-videos`)

Port the tooling from `/Users/quinntynebrown/projects/6ixstack/frontend/e2e/demo/` (`scripts/`, `README.md`,
`requirements.txt`, `music/`) to `frontend/e2e/demo/`, adapted to ingresso, and add an npm `demo` script:

- A Playwright runner that executes `journeys/NN-slug.ts`, takes screenshots at named beats, and writes them to
  `docs/demos/NN-slug/screenshots/`.
- A text-to-speech script using Kokoro-82M (`hexgrad/Kokoro-82M`) from Hugging Face, run locally, default
  voice `af_heart`. Pin the package version and document the setup in the README.
- Background music: the upbeat soca track from Pixabay, copied with its `CREDITS.md` (title, artist, URL and the
  Pixabay Content License). If it is missing and the download needs a human, finish everything else and report
  this as the blocker with the track URL.
- An ffmpeg build script: screenshots with gentle zoom and crossfades, narration per screenshot, music looped,
  faded and ducked under the voice, H.264 + AAC MP4 at 1280 × 720. **No captions by default**; a `--captions`
  flag is the only way to add them.
- A verify script: ffprobe streams and duration, ebur128 loudness, three frames extracted for a look.

## Phase 5: Narrated demo video (`recording-demo-videos`)

Follow the skill, with these overrides:

- Use the demo tooling under `frontend/e2e/demo/` (added by `00-scaffold`). Do not use edge-tts.
- Run the app and API locally against the seeded SQLite database, as Playwright does. If ports 4200 or 5100
  are taken by another project, use free ports instead; never stop a process this run did not start.
- Storyboard (adjust to what was built; show only what works):
  1. Sign in through the test seam and show the dashboard shell in light theme.
  2. The same in dark theme.
  3. The header menu at phone width.
  4. Visit an unknown URL to show the not-found page.
  5. Show a toast and a status banner.
- Drive it with `frontend/e2e/demo/journeys/00-scaffold.ts` in Chromium. Take a screenshot at each beat at
  1280 × 720, light theme. Add a dark-theme or phone-width shot where the mocks differ. Save them as
  `docs/demos/00-scaffold/screenshots/NN-beat-name.png`.
- Write one short narration paragraph per screenshot: second person, warm, plain, no jargon. Open with what
  "the ingresso app shell" lets you do, close with a one-line recap. Save it as `docs/demos/00-scaffold/narration.md`.
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
- Save `docs/demos/00-scaffold/demo.mp4` (tracked with Git LFS) and `credits.md` (voice model and its licence;
  music title, artist, Pixabay URL and the Pixabay Content License).

## Phase 6: Pull request

- Run the full regression: `dotnet build Ingresso.sln && dotnet test`, and in `frontend/`: `npm run lint`,
  `npm run format:check`, `npm run tokens:check`, `npm run build`, `npm run build-storybook`, and the
  Playwright suite in Chromium (`npm run e2e`) including visual regression.
- `git fetch origin && git rebase origin/main`, then push the `journey/00-scaffold` branch.
- `gh pr create --base main --title "chore(solution): ingresso baseline"`. In the body: what the user can now do, the requirements
  covered, the tests added, decisions made, anything deferred, and the path to `docs/demos/00-scaffold/demo.mp4`
  in the branch.
- `gh pr checks --watch`. If a check fails, fix the cause, push, and watch again.

## Phase 7: Merge

- When every check is green, merge: `gh pr merge --squash --delete-branch`. This prompt authorises the merge.
- `git checkout main && git pull`, then build once more to confirm main is green.
- If branch protection needs a human review, report that as the blocker with the PR link.

## Deferred

- Every journey in `docs/journey.md`.

## Done means

- `main` has the first commit, and the solution builds, migrates, seeds and runs locally, so every journey
  prompt can start from `main`.
- The platform requirements above work as they state.
- All new and existing tests pass, in Chromium only.
- The documentation agrees with the code: mocks, design system, screen composition, requirements, design and
  estimate.
- `docs/demos/00-scaffold/demo.mp4` is narrated with the Kokoro voice, has soca music under it, and has no
  captions.
- The pull request is merged to `main` with green checks, and `main` builds.
- Only then end the run, with a short summary of what was built, the decisions made, the PR link, and anything
  deferred.
