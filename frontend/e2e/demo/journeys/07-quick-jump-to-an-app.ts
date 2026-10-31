import type { Journey } from '../scripts/run-journey';

/** Quick jump: press /, type, move the highlight, press Enter, then search for something that is not there. */
const journey: Journey = async ({ page, shot }) => {
  const response = await page.request.post('/api/test/sign-in', { data: { email: 'dev@ingresso.dev' } });
  if (!response.ok()) throw new Error(`Test sign-in failed: ${response.status()}`);

  // Stand in for the real sites, so the demo never depends on the internet.
  await page.context().route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (route) => {
    const host = new URL(route.request().url()).host;
    return route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `<!doctype html><title>${host}</title><body style="font:600 28px system-ui;display:grid;place-items:center;height:100vh;margin:0;background:#fff;color:#17181c">${host} opened in its own tab</body>`,
    });
  });

  await page.goto('/');
  await page.getByText('Gmail', { exact: true }).waitFor();
  await shot('dashboard');

  await page.keyboard.press('/');
  await shot('search-focused');

  const search = page.getByRole('searchbox', { name: 'Jump to an app' });
  await search.pressSequentially('or', { delay: 120 });
  await page
    .getByRole('status')
    .filter({ hasText: /apps? match/ })
    .waitFor({ state: 'attached' });
  await shot('typed-first-match-highlighted');

  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(300);
  await shot('highlight-moved');

  const popupPromise = page.waitForEvent('popup');
  await page.keyboard.press('Enter');
  const popup = await popupPromise;
  await popup.waitForLoadState();
  await shot('app-opened', { page: popup });

  await page.bringToFront();
  await search.fill('');
  await search.pressSequentially('zzz', { delay: 120 });
  await page.getByText('No apps match that search').waitFor();
  await shot('no-match');
};

export default journey;
