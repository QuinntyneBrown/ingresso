import type { Journey } from '../scripts/run-journey';

/** Switch theme: the dashboard, Settings from the account menu, choosing Dark, and it staying after a reload. */
const journey: Journey = async ({ page, shot }) => {
  const response = await page.request.post('/api/test/sign-in', { data: { email: 'dev@ingresso.dev' } });
  if (!response.ok()) throw new Error(`Test sign-in failed: ${response.status()}`);

  await page.goto('/');
  await page.getByText('Datadog', { exact: true }).waitFor();
  await shot('dashboard-in-light');

  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Settings' }).click();
  await page.getByRole('heading', { level: 1, name: 'Settings' }).waitFor();
  await shot('settings');

  await page.getByRole('radio', { name: 'Dark' }).check();
  await page.waitForTimeout(400);
  await shot('dark-chosen');

  await page.getByRole('link', { name: 'Back to your apps' }).click();
  await page.getByText('Datadog', { exact: true }).waitFor();
  await shot('dashboard-in-dark');

  await page.reload();
  await page.getByText('Datadog', { exact: true }).waitFor();
  await shot('kept-after-reload');
};

export default journey;
