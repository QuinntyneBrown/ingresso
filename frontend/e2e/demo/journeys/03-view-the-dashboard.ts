import type { Journey } from '../scripts/run-journey';

/** View the dashboard: loading, the full grid, tablet and phone widths, and the empty state. */
const journey: Journey = async ({ page, shot }) => {
  const response = await page.request.post('/api/test/sign-in', { data: { email: 'dev@ingresso.dev' } });
  if (!response.ok()) throw new Error(`Test sign-in failed: ${response.status()}`);

  // Hold the first tile request so the loading skeleton can be seen.
  let release: () => void = () => undefined;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/api/tiles', async (route) => {
    if (route.request().method() === 'GET') await held;
    await route.fallback();
  });
  await page.goto('/');
  await page.getByText('Loading your apps…').first().waitFor();
  await shot('loading');
  release();
  await page.getByText('Gmail', { exact: true }).waitFor();
  await page.unroute('**/api/tiles');
  await shot('full-dashboard');

  await page.setViewportSize({ width: 900, height: 800 });
  await page.waitForTimeout(500);
  await shot('tablet');

  await page.setViewportSize({ width: 390, height: 760 });
  await page.waitForTimeout(500);
  await shot('phone', { phone: true });
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.route('**/api/tiles', async (route) => {
    if (route.request().method() === 'GET')
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    else await route.fallback();
  });
  await page.reload();
  await page.getByText('No apps behind this door yet').waitFor();
  await shot('empty-state');
};

export default journey;
