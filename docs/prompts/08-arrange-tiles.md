# Journey 08: Arrange tiles

## Goal

At 1024 px and wider, **Edit layout** switches the dashboard into edit mode: grid lines, a layout bar, a resize
handle on each tile, and Edit buttons. The user drags a tile to free cells or drags its corner to resize it, or
does the same from the keyboard (arrows move, Shift + arrows resize). Moves into occupied cells or past the size
limits (2–12 columns, 1–8 rows) are refused and announced, and no other tile moves. Every change saves as one
`PUT /api/tiles/layout`. **Done** leaves edit mode; narrowing the window below 1024 px ends it.

- Detailed design: `docs/detailed-designs/dashboard/edit-layout/`
- Requirements: L2-015, L2-016, L2-017, L2-020, L2-041, L2-051, L2-052, L2-054 in `docs/specs/L2.md`, plus the cross-cutting ones the design cites.
- Mocks: `docs/mocks/pages/dashboard/editing.html`, `docs/mocks/pages/dashboard/editing-refused.html`, `docs/mocks/pages/dashboard/editing-narrow.html`
- Prerequisites: `docs/prompts/00-scaffold.md` and journeys 01–07 are merged to `main`.
- Unchanged: tile fields, and the saved layout when the window narrows or widens.

### What exists today

Most of this is built: `ig-tile-grid` (ported from qbc-grid, see `docs/adr/0010-free-placement-dashboard-grid.md`),
`ig-layout-bar`, `SaveLayout.cs` behind `PUT /api/tiles/layout`, the optimistic `TilesStore.saveLayout` with
rollback, and `frontend/e2e/tests/edit-layout.spec.ts` (pointer, keyboard, refusals, limits, narrow window).
The known gap is L2-020 criterion 2: `TilesStore.editing` survives navigation, so the dashboard reopens in edit
mode after leaving and coming back.

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
- Invoke and follow `implementing-incrementally` before any code, with ATDD for every slice.
- If something seems to need more scope, leave it out, note it as deferred, and continue.
- If this journey needs behaviour from a journey later in `docs/journey.md`, depend on an interface or seam
  and leave that behaviour to its own journey. Do not build it here.
- Work through the phases below **in order**, using the skill each phase names.
- Copy the house style of each folder. Read the existing neighbours before you write anything new.

## Start

- `git checkout main && git pull`, then `git checkout -b journey/08-arrange-tiles`.

## Phase 1: Mocks (`writing-html-mocks`)

- The mocks above exist. Check them against the requirements. Add only missing states, light and dark, at phone, tablet and desktop widths, and update the manifest, gallery and coverage matrix.

## Phase 2: Design system (`extracting-design-systems`, `writing-screen-composition`)

- Check `docs/design-system/` covers every component these screens use. Add or update only what is missing.
- Update `docs/screen-composition.md` for these screens.

## Phase 3: Requirements (`writing-requirements`)

- L2-015, L2-016, L2-017, L2-020, L2-041, L2-051, L2-052, L2-054 exist. Fix gaps or ambiguity in their acceptance criteria only. New requirements, if any, take the next free number after L2-054.

## Phase 4: Detailed design (`writing-design-documents`)

- `docs/detailed-designs/dashboard/edit-layout/` exist. Update them only where the work shows they are wrong or silent, re-render changed diagrams, and record decisions in the open-questions section or an ADR.

## Phase 5: Estimate (`estimating-designs`)

- Refresh `docs/estimates/` for this design before you start, and again at the end with the true percent complete.

## Phase 6: Incremental implementation (ATDD)

- Read the existing code and tests first. Keep what already meets the requirements, and close the gaps test-first. Do not rebuild what works.
- Plan thin vertical slices, for example:
  1. Edit layout shows the layout bar, grid lines, handles and Edit buttons, announced; Done turns it off (L2-015).
  2. Pointer move and resize into free cells, saved; refusal into occupied cells; Escape cancels a drag (L2-016).
  3. Keyboard move and resize with announcements and refusals; key instructions in the accessible description (L2-017).
  4. Size limits in the grid and in the API (L2-051, L2-052).
  5. A failed save restores the previous layout and shows an error toast (L2-016).
  6. Leaving and returning opens the dashboard in normal mode (L2-020).
  7. Edit layout disabled with an explanation below 1024 px; narrowing ends edit mode (L2-054).
  8. Layout shown within 100 ms of a drop, and 60 fps drags with 200 tiles (L2-041), checked with the perf-test `TileGrid` scenario.
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
  1. The dashboard.
  2. Choose Edit layout and show the grid lines and layout bar.
  3. Drag a tile to free cells.
  4. Resize a tile by its corner.
  5. Try to drop on another tile and show the refusal.
  6. Move a tile with the keyboard.
  7. Choose Done.
- Drive it with `frontend/e2e/demo/journeys/08-arrange-tiles.ts` in Chromium. Take a screenshot at each beat at
  1280 × 720, light theme. Add a dark-theme or phone-width shot where the mocks differ. Save them as
  `docs/demos/08-arrange-tiles/screenshots/NN-beat-name.png`.
- Write one short narration paragraph per screenshot: second person, warm, plain, no jargon. Open with what
  "Arrange tiles" lets you do, close with a one-line recap. Save it as `docs/demos/08-arrange-tiles/narration.md`.
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
- Save `docs/demos/08-arrange-tiles/demo.mp4` (tracked with Git LFS) and `credits.md` (voice model and its licence;
  music title, artist, Pixabay URL and the Pixabay Content License).

## Phase 8: Pull request

- Run the full regression: `dotnet build Ingresso.sln && dotnet test`, and in `frontend/`: `npm run lint`,
  `npm run format:check`, `npm run tokens:check`, `npm run build`, `npm run build-storybook`, and the
  Playwright suite in Chromium (`npm run e2e`) including visual regression.
- `git fetch origin && git rebase origin/main`, then push the `journey/08-arrange-tiles` branch.
- `gh pr create --base main --title "feat(dashboard): arrange tiles"`. In the body: what the user can now do, the requirements
  covered, the tests added, decisions made, anything deferred, and the path to `docs/demos/08-arrange-tiles/demo.mp4`
  in the branch.
- `gh pr checks --watch`. If a check fails, fix the cause, push, and watch again.

## Phase 9: Merge

- When every check is green, merge: `gh pr merge --squash --delete-branch`. This prompt authorises the merge.
- `git checkout main && git pull`, then build once more to confirm main is green.
- If branch protection needs a human review, report that as the blocker with the PR link.

## Deferred

- Reset layout (journey 13).
- Touch dragging: the grid needs 1024 px or wider.

## Done means

- A user moves and resizes tiles by pointer and keyboard in edit mode, refusals are announced, every change is saved, and edit mode never survives navigation, as the requirements state.
- All new and existing tests pass, in Chromium only.
- The documentation agrees with the code: mocks, design system, screen composition, requirements, design and
  estimate.
- `docs/demos/08-arrange-tiles/demo.mp4` is narrated with the Kokoro voice, has soca music under it, and has no
  captions.
- The pull request is merged to `main` with green checks, and `main` builds.
- Only then end the run, with a short summary of what was built, the decisions made, the PR link, and anything
  deferred.
