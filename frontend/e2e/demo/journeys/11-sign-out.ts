import type { Journey } from '../scripts/run-journey';

/** Sign out: the account menu, the confirmation, and landing on Sign in. */
const journey: Journey = async ({ page, shot }) => {
  const response = await page.request.post('/api/test/sign-in', { data: { email: 'dev@ingresso.dev' } });
  if (!response.ok()) throw new Error(`Test sign-in failed: ${response.status()}`);

  await page.goto('/');
  await page.getByText('Datadog', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).waitFor();
  await shot('account-menu-open');

  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await page.getByRole('dialog', { name: 'Sign out of ingresso?' }).waitFor();
  await shot('confirm-sign-out');

  await page.getByRole('dialog').getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL(/\/sign-in/);
  await page.getByRole('heading', { level: 1 }).waitFor();
  await shot('back-at-sign-in');
};

export default journey;
