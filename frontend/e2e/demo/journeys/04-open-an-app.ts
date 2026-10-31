import type { Journey } from '../scripts/run-journey';

/** Open an app: click a tile, the app opens in its own tab, and the dashboard notes it was just opened. */
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

  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: /Gmail/ }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  await shot('app-in-new-tab', { page: popup });

  await page.bringToFront();
  await page.getByText('Opened just now').first().waitFor();
  await shot('back-on-dashboard');
};

export default journey;
