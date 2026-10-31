# Journey 14: Switch theme

## Goal

The app follows the system theme by default. On the Settings page (`/settings`, reached from the account menu)
the user chooses Light, Dark or System; the choice applies at once and is kept across visits. Both themes meet
WCAG 2.2 AA contrast.

- Detailed design: `docs/detailed-designs/platform/responsive-accessible-ui/`
- Requirements: L2-044 in `docs/specs/L2.md`, plus the cross-cutting ones the design cites.
- Mocks: `docs/mocks/pages/settings/default.html`, `docs/mocks/pages/settings/loading.html`, `docs/mocks/pages/settings/invalid.html`, `docs/mocks/pages/settings/success.html`, `docs/mocks/pages/settings/error.html`
- Prerequisites: `docs/prompts/00-scaffold.md` and journeys 01–13 are merged to `main`.
- Unchanged: every other screen, apart from its colours.

### What exists today

The token theme in `frontend/projects/components/src/lib/tokens/` already generates light and dark values.
There is no Settings page in the app yet. The account menu (built in journey 11) gains a Settings item here.

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
  - Backend acceptance tests are API integration tests in `tests/Ingresso.Api.Tests` on per-fixture in-memory
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
- If this journey needs behaviour from a journey later in `docs/journey.md`, depend on an interface or seam
  and leave that behaviour to its own journey. Do not build it here.
- Work through the phases below **in order**, using the skill each phase names.
- Copy the house style of each folder. Read the existing neighbours before you write anything new.

## Start

- `git checkout main && git pull`, then `git checkout -b journey/14-switch-theme`.

## Phase 1: Mocks (`writing-html-mocks`)

- The mocks above exist. Check them against the requirements. Add only missing states, light and dark, at phone, tablet and desktop widths, and update the manifest, gallery and coverage matrix.

## Phase 2: Design system (`extracting-design-systems`, `writing-screen-composition`)

- Check `docs/design-system/` covers every component these screens use. Add or update only what is missing.
- Update `docs/screen-composition.md` for these screens.

## Phase 3: Requirements (`writing-requirements`)

- L2-044 exist. Fix gaps or ambiguity in their acceptance criteria only. New requirements, if any, take the next free number after L2-054.
- Decide where the choice is kept (browser storage or the account) and record it. The settings mock shows more than the theme; build only the theme section and defer the rest.

## Phase 4: Detailed design (`writing-design-documents`)

- `docs/detailed-designs/platform/responsive-accessible-ui/` exist. Update them only where the work shows they are wrong or silent, re-render changed diagrams, and record decisions in the open-questions section or an ADR.

## Phase 5: Estimate (`estimating-designs`)

- Refresh `docs/estimates/` for this design before you start, and again at the end with the true percent complete.

## Phase 6: Incremental implementation (ATDD)

- Read the existing code and tests first. Keep what already meets the requirements, and close the gaps test-first. Do not rebuild what works.
- Plan thin vertical slices, for example:
  1. Follow the system theme on first load (L2-044).
  2. Settings page with the theme choice, built from `Card`, `Choice` and `Check` as the screen composition lists; the choice applies at once (L2-044).
  3. The choice is kept across reloads (L2-044).
  4. AA contrast in both themes, checked in the Playwright run (L2-044).
- For each slice:
  - Write the Given-When-Then criteria from the requirement.
  - Write the acceptance test (API integration test or Playwright with a page object), traced to the
    requirement.
  - Run it and show it fails for the expected reason. If an existing test already covers the criterion and
    passes, show that instead, and make sure it carries the trace header.
  - Implement the minimum that makes it pass, and refactor while green.
  - Run the regression checks, then commit.
- Add the Playwright visual baselines for the new or changed screens and states, compared against the mocks.
- When all slices are green, keep the mocks, design system, screen composition, design and estimate aligned with what was built.

## Phase 7: Narrated demo video (`recording-demo-videos`)

Follow the skill, with these overrides:

- Use the demo tooling under `frontend/e2e/demo/` (added by `00-scaffold`). Do not use edge-tts.
- Run the app and API locally against the seeded SQLite database, as Playwright does. If ports 4200 or 5100
  are taken by another project, use free ports instead; never stop a process this run did not start.
- Storyboard (adjust to what was built; show only what works):
  1. The dashboard in light theme.
  2. Open Settings from the account menu.
  3. Choose Dark.
  4. Back on the dashboard in dark theme.
  5. Reload and show it kept.
- Drive it with `frontend/e2e/demo/journeys/14-switch-theme.ts` in Chromium. Take a screenshot at each beat at
  1280 × 720, light theme. Add a dark-theme or phone-width shot where the mocks differ. Save them as
  `docs/demos/14-switch-theme/screenshots/NN-beat-name.png`.
- Write one short narration paragraph per screenshot: second person, warm, plain, no jargon. Open with what
  "Switch theme" lets you do, close with a one-line recap. Save it as `docs/demos/14-switch-theme/narration.md`.
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
- Save `docs/demos/14-switch-theme/demo.mp4` (tracked with Git LFS) and `credits.md` (voice model and its licence;
  music title, artist, Pixabay URL and the Pixabay Content License).

## Phase 8: Pull request

- Run the full regression: `dotnet build Ingresso.sln && dotnet test`, and in `frontend/`: `npm run lint`,
  `npm run format:check`, `npm run tokens:check`, `npm run build`, `npm run build-storybook`, and the
  Playwright suite in Chromium (`npm run e2e`) including visual regression.
- `git fetch origin && git rebase origin/main`, then push the `journey/14-switch-theme` branch.
- `gh pr create --base main --title "feat(platform): switch theme"`. In the body: what the user can now do, the requirements
  covered, the tests added, decisions made, anything deferred, and the path to `docs/demos/14-switch-theme/demo.mp4`
  in the branch.
- `gh pr checks --watch`. If a check fails, fix the cause, push, and watch again.

## Phase 9: Merge

- When every check is green, merge: `gh pr merge --squash --delete-branch`. This prompt authorises the merge.
- `git checkout main && git pull`, then build once more to confirm main is green.
- If branch protection needs a human review, report that as the blocker with the PR link.

## Deferred

- The other settings sections in the mock.
- The brand guide page.

## Done means

- A user picks light, dark or system on Settings, and the choice applies at once and is kept, as the requirements state.
- All new and existing tests pass, in Chromium only.
- The documentation agrees with the code: mocks, design system, screen composition, requirements, design and
  estimate.
- `docs/demos/14-switch-theme/demo.mp4` is narrated with the Kokoro voice, has soca music under it, and has no
  captions.
- The pull request is merged to `main` with green checks, and `main` builds.
- Only then end the run, with a short summary of what was built, the decisions made, the PR link, and anything
  deferred.
