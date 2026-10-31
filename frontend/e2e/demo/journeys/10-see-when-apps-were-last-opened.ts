import type { Journey } from '../scripts/run-journey';

/** See when apps were last opened: the dashboard, open an app, and the tile says it was opened just now. */
const journey: Journey = async ({ page, shot }) => {
  const response = await page.request.post('/api/test/sign-in', { data: { email: 'dev@ingresso.dev' } });
  if (!response.ok()) throw new Error(`Test sign-in failed: ${response.status()}`);

  await page.goto('/');
  await page.getByText('Datadog', { exact: true }).waitFor();
  await shot('every-tile-says-when-it-was-opened');

  const tile = page.locator('ig-app-tile').filter({ hasText: 'Gmail' });
  await tile.getByRole('link').hover();
  await shot('open-an-app');
  const [popup] = await Promise.all([page.waitForEvent('popup'), tile.getByRole('link').click()]);
  await popup.close();

  await tile.getByText('Opened just now').waitFor();
  await shot('opened-just-now');
};

export default journey;
