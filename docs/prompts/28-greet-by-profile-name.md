# Feature 28: Greet by profile name

## Goal

The dashboard greets a person by the profile name they saved, never by their email address. A person sets a
profile name that is different from their email, saves it, and the dashboard heading reads **"Hi, {profile
name}"** straight away and on every later visit.

- Requirements: L2-117 (set a display name) already exists; Phase 3 adds a new L2 for the greeting and amends
  L2-117 where it says the email is used "wherever a name would show".
- Detailed designs: `docs/detailed-designs/dashboard/show-dashboard/` (the greeting) and
  `docs/detailed-designs/identity-provider/share-profile-claims/` (the display name and Settings → Profile).
- Prerequisites: journeys 00–27 in `docs/journey.md` are merged to `main`.
- Unchanged: how the display name is stored and validated (L2-117: optional, trimmed, 100 characters, no line
  breaks or control characters), the Edit your profile dialog's fields, the `profile` and `email` claims apps
  receive (journey 22), and the header avatar initials rules.

### What exists today

- People can already save a display name in **Settings → Profile** (`pages/settings/profile-card.ts`,
  `dialogs/edit-profile/edit-profile-dialog.ts`, `ProfileController`, `Ingresso.Application/Identity/Profile.cs`).
- `GetCurrentUser` returns `Name = user.Name ?? user.Email`, so a person without a display name has their
  email as their "name".
- `pages/dashboard/dashboard-page.ts` renders `{{ greeting() }}, {{ firstName() }}` where `greeting()` is
  "Good morning/afternoon/evening" (`shared/relative-time.ts` `greetingFor`) and `firstName()` is the first
  space-separated word of that name. With no display name the heading is the whole email address, for example
  "Good afternoon, quinntynebrown@gmail.com", which overflows the page at phone width (seen on ingresso.ca in
  iOS Safari).
- Every mock in `docs/mocks/pages/dashboard/` shows "Good afternoon, Maya".

### What changes

1. The heading reads "Hi, {display name}", using the whole saved display name (not just its first word). Long
   names wrap; the heading never scrolls the page sideways at 320 px.
2. With no display name the heading reads "Hi there" — never the email — and the intro shows a subtle link
   button, "Add your name", that opens the existing Edit your profile dialog. It disappears once a name is saved.
3. After Save changes in Edit your profile (from Settings or from the dashboard link), the dashboard heading
   shows the new name without a reload, and still shows it after signing out and back in.
4. The current-user API tells the frontend the display name and the email separately (for example a nullable
   `displayName` next to `email`), so the frontend never has to guess whether `name` is an email. Keep `name`
   only if other callers need it; record the choice.

## Finish the whole feature in one run. Do not stop. (CRITICAL)

- You are authorised to take this feature all the way: mocks, design system, requirements, design, estimate,
  implementation, a narrated demo video, a pull request with green checks, and the merge. Go through every
  phase and every slice in one continuous run. Do not pause between phases to report, ask for approval, or
  wait for "continue".
- Do not end your turn until the "Done means" list at the bottom is fully true. A partial result, a plan, or
  "the next steps would be..." is not done.
- Where `AGENTS.md` says "stop and ask", treat this prompt as the confirmation in advance for everything in
  scope here. Choose the simplest option that fits the existing architecture, record it (an architecture
  decision record in `docs/adr/` or the detailed design's open-questions section), and keep going.
- If the `components` library lacks something, that is not a reason to stop. Update the design system
  catalogue (`docs/design-system/`) and the library first, as the project rules require, then go on.
- When a test, build or command fails, find the root cause and fix it, then go on. Never weaken a test to make
  it pass, and never skip a step quietly.
- Only stop for a real blocker you cannot resolve yourself, such as missing credentials or branch protection
  that needs a human review. If that happens, finish everything else first, then report the blocker clearly.
- Keep track of progress (a todo list), so that nothing gets left out after context is summarised.

## Rules (read first, binding)

- Follow `AGENTS.md` exactly, especially:
  - The mandatory folder structure. Don't add top-level folders or projects without updating its tree.
  - Strict backend layering: Domain, Application, Infrastructure, Api, Cli. Business rules in handlers and
    domain, never controllers. The API never migrates on startup; this feature should need no migration
    (`User.Name` already exists). If one turns out to be needed, the CLI `migrate` command applies it.
  - Backend acceptance tests are API integration tests in `backend/tests/Ingresso.Api.Tests` on per-fixture
    in-memory SQLite. No database server. API tests run sequentially.
  - Frontend acceptance tests are Playwright with the Page Object Model: `frontend/e2e/pages/dashboard.page.ts`,
    `settings.page.ts` and `edit-profile.dialog.ts` own the selectors; tests in `frontend/e2e/tests/` never
    hold a selector. Chromium only.
  - The `components` library is mandatory. `docs/screen-composition.md` is binding: build the dashboard intro
    and the "Add your name" link from exactly the components its entry lists. Editing opens the existing CDK
    Dialog (`DialogShell`), never an inline form. Toasts go through `ToastService`.
  - Pages depend on the `AUTH_API` injection token and `SessionStore`, not concrete services.
  - Prettier and angular-eslint must pass (`npm run lint`, `npm run format:check` in `frontend/`).
  - Acceptance tests start with `// Acceptance Test`, `// Traces to: L2-nnn`, `// Description: ...`.
  - Never write architecture tests. Never weaken a test.
- Invoke and follow `implementing-incrementally` before any code, with ATDD for every slice.
- If something seems to need more scope, leave it out, note it as deferred, and continue.
- Work through the phases below **in order**, using the skill each phase names.
- Copy the house style of each folder. Read the existing neighbours before you write anything new.

## Start

- `git checkout main && git pull`, then `git checkout -b feature/28-greet-by-profile-name`.

## Phase 1: Mocks (`writing-html-mocks`)

- Update every mock in `docs/mocks/pages/dashboard/` so the heading reads "Hi, Maya Okafor" (or the mocks'
  existing full name).
- Add `docs/mocks/pages/dashboard/name-unset.html`: "Hi there" with the "Add your name" link button, and
  `name-long.html`: a 100-character name wrapping cleanly at phone width.
- Add the dashboard state where Edit your profile is open over it, if the existing
  `docs/mocks/dialogs/edit-profile/` states don't already cover that.
- Light and dark, at phone, tablet and desktop widths. Update `docs/mocks/manifest.json`, the gallery
  (`docs/mocks/index.html`) and the coverage matrix.

## Phase 2: Design system (`extracting-design-systems`, `writing-screen-composition`)

- Check the design system covers a link-style button in the intro and a wrapping display heading. Add only
  what is missing.
- Update the Dashboard entry in `docs/screen-composition.md` with the new states (`name-unset`, `name-long`)
  and the components the "Add your name" link uses.

## Phase 3: Requirements (`writing-requirements`)

- Add an L2 requirement (next free number after the highest in `docs/specs/L2.md`, currently L2-145),
  "Greet by profile name", with Given/When/Then criteria for:
  - a person with a display name sees "Hi, {display name}";
  - a person without one sees "Hi there" and "Add your name", and never their email address;
  - saving, changing or clearing the name updates the heading without a reload;
  - the saved name survives sign-out and sign-in;
  - a 100-character name wraps without sideways scrolling at 320 px;
  - the name is rendered as text, never as HTML.
- Amend L2-117 criteria 3 and 4 and its "Not set" copy so they no longer promise the email in the greeting,
  and cross-reference the new requirement. Cross-reference L2-032 (dashboards are private) instead of copying it.
- Update `docs/specs/L1.md` only if no L1 already covers personalising the dashboard.

## Phase 4: Detailed design (`writing-design-documents`)

- Update `docs/detailed-designs/dashboard/show-dashboard/` for the greeting: the heading rule, the unset
  state, the "Add your name" link opening `EditProfileDialog`, and how `SessionStore.refresh()` keeps it current.
- Update `docs/detailed-designs/identity-provider/share-profile-claims/` for the current-user contract change
  (display name and email as separate fields) and every frontend caller of `CurrentUser.name`.
- Record the decision to drop the time-of-day greeting for "Hi" in an ADR in `docs/adr/` (next number after 0023).

## Phase 5: Estimate (`estimating-designs`)

- Add or update the affected rows in `docs/estimates/dashboard.md` and `docs/estimates/identity-provider.md`
  and the root README at their real percent before you start, and update them at the end.

## Phase 6: Incremental implementation (ATDD)

- Read the existing code and tests first. Keep what already meets the requirements, and close the gaps
  test-first. Do not rebuild what works.
- Plan thin vertical slices, for example:
  1. API: `GET` current user returns the display name (or null) and the email as separate fields
     (API integration test in `Ingresso.Api.Tests`).
  2. Dashboard: a person with a saved display name sees "Hi, {display name}" (Playwright via `dashboard.page.ts`).
  3. Dashboard: a person without one sees "Hi there" and "Add your name", never the email.
  4. "Add your name" opens Edit your profile; saving updates the heading without a reload; clearing brings
     back "Hi there"; the name survives sign-out and sign-in.
  5. A long name wraps at 320 px with no horizontal page scroll; visual baselines for the new states.
  6. Remove `firstName()` and any now-unused greeting helper; update the header and account menu if they
     relied on `name` being the email.
- For each slice:
  - Write the Given-When-Then criteria from the requirement.
  - Write the acceptance test, traced to the requirement.
  - Run it and show it fails for the expected reason. If an existing test already covers the criterion and
    passes, show that instead, and make sure it carries the trace header.
  - Implement the minimum that makes it pass, and refactor while green.
  - Run the regression checks, then commit.
- Update existing tests and visual baselines that assert "Good afternoon" — these are intentional design
  changes, so update the baselines, but never loosen an assertion.
- When all slices are green, keep the mocks, design system, screen composition, requirements, designs and
  estimate aligned with what was built.

## Phase 7: Narrated demo video (`recording-demo-videos`)

- Follow the skill and the house style of the earlier prompts (for example
  `docs/prompts/27-review-sign-in-activity.md` Phase 7): the demo tooling under `frontend/e2e/demo/`, the same
  voice, music and no-captions rules, run locally against the seeded SQLite database.
- Storyboard (adjust to what was built; show only what works):
  1. A new account's dashboard says "Hi there" with "Add your name".
  2. Adding a profile name; the heading changes to "Hi, {name}" at once.
  3. Settings → Profile shows the name and the separate email; signing out and back in keeps the greeting.
- Save `docs/demos/28-greet-by-profile-name/demo.mp4` (Git LFS) and `credits.md`.

## Phase 8: Pull request

- Run the full regression: `dotnet build Ingresso.sln && dotnet test`, and in `frontend/`: `npm run lint`,
  `npm run format:check`, `npm run tokens:check`, `npm run build`, `npm run build-storybook`, and the
  Playwright suite in Chromium (`npm run e2e`) including visual regression.
- `git fetch origin && git rebase origin/main`, then push the `feature/28-greet-by-profile-name` branch.
- Open a pull request to `main` titled "feat(dashboard): greet by profile name". In the body: what the user
  can now do, the requirements covered, the tests added, decisions made, anything deferred, and the demo path.
- Watch the checks. If one fails, fix the cause, push, and watch again.

## Phase 9: Merge

- When every check is green, squash-merge and delete the branch. This prompt authorises the merge.
- `git checkout main && git pull`, then build once more to confirm main is green.
- If branch protection needs a human review, report that as the blocker with the PR link.

## Deferred

- Asking for a profile name during first sign-in or email verification.
- A separate first name / last name, nicknames, or pronouns.
- Profile photos.
- A time-of-day greeting as a user preference.

## Done means

- A person saves a profile name different from their email, and the dashboard says "Hi, {profile name}" at
  once and on every later visit; without a name it says "Hi there" and never shows the email.
- All new and existing tests pass, in Chromium only.
- The documentation agrees with the code: mocks, design system, screen composition, requirements, designs,
  ADR and estimate.
- `docs/demos/28-greet-by-profile-name/demo.mp4` is recorded to the house rules.
- The pull request is merged to `main` with green checks, and `main` builds.
- Only then end the run, with a short summary of what was built, the decisions made, the PR link, and anything
  deferred.
