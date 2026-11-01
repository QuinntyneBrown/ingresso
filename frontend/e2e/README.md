# End-to-end tests

Playwright in Chromium only, with the Page Object Model.

- `pages/` holds one page object per screen. Page objects own every selector and interaction.
- `tests/` holds the acceptance tests. Tests state intent through page objects and never contain a selector.
- `visual-baselines/` holds the screenshot baselines. Update them only for intentional design changes:
  `npm run e2e:update`.
- `support/global-setup.ts` builds the solution, resets `e2e/.data/e2e.db` with the CLI and starts the API
  on it (port 5100, or `PW_API_PORT`) with the clock fixed at Monday, November 2, 2026 and the test sign-in seam on.
  Playwright starts `ng serve` (port 4200, or `PW_WEB_PORT`), which proxies `/api`, `/health`, `/auth/`, `/connect`
  and `/.well-known` to the API. The global setup also starts the sample relying party
  (`backend/samples/Ingresso.SampleApp`, port 5201 or `PW_SAMPLE_PORT`), which `seed` registers as a client.
- `support/stub-api.ts` is a browser-side fake of `/api/auth/me` and `/api/tiles`. Tests use it to reach states the
  seed data does not hold (no apps, a slow or failed load). `E2E_FAKE_API=1` installs it for every test, which runs
  the suite without the .NET API.

```bash
cd frontend
npm run e2e                       # whole suite
npx playwright test dashboard     # one file
E2E_API_LOGS=1 npm run e2e        # show API output
E2E_FAKE_API=1 npm run e2e        # no .NET API: fake /api in the browser
```
