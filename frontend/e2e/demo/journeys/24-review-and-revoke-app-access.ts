import { SAMPLE_APP_URL } from '../../support/api-server';
import type { Journey } from '../scripts/run-journey';

/** Review and revoke app access: Connected apps lists the sample app; revoke it, and the next sign-in asks again. */
const journey: Journey = async ({ page, context, shot, baseURL }) => {
  // Token dates come from the real clock; show "Last used" against it too.
  await page.clock.setSystemTime(new Date());
  const signedIn = await page.request.post(`${baseURL}/api/test/sign-in`, {
    data: { email: 'dev@ingresso.dev' },
  });
  if (!signedIn.ok()) throw new Error(`Demo sign-in failed: ${signedIn.status()}`);

  // 1. Sign in to the sample app and allow it.
  await page.goto(SAMPLE_APP_URL);
  await page.getByRole('link', { name: 'Sign in with ingresso' }).click();
  await page.waitForURL(/\/consent\?/);
  await page.getByRole('button', { name: 'Allow' }).click();
  await page.locator('[data-greeting]').waitFor();
  await shot('signed-in-to-the-app');

  // 2. Settings → Connected apps lists it, with what it can do and when.
  await page.goto(`${baseURL}/settings`);
  const card = page.getByRole('region', { name: 'Connected apps', exact: true });
  await card.getByRole('button', { name: 'Revoke Sample app’s access' }).waitFor();
  await card.scrollIntoViewIfNeeded();
  await shot('connected-apps');

  // 3. Revoke asks first.
  await card.getByRole('button', { name: 'Revoke Sample app’s access' }).click();
  const dialog = page.getByRole('dialog', { name: 'Revoke Sample app’s access?' });
  await dialog.getByRole('button', { name: 'Revoke access' }).waitFor();
  await page.waitForTimeout(400);
  await shot('revoke-asks-first');

  // 4. Revoked: a toast, and the app is gone.
  await dialog.getByRole('button', { name: 'Revoke access' }).click();
  await page.locator('.toast-region').getByText('Access revoked').waitFor();
  await card.getByRole('heading', { name: 'No connected apps' }).waitFor();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(200);
  await shot('access-revoked');

  // 5. The app's next sign-in asks again.
  await context.clearCookies({ name: 'sample-app.session' });
  await page.goto(SAMPLE_APP_URL);
  await page.getByRole('link', { name: 'Sign in with ingresso' }).click();
  await page.waitForURL(/\/consent\?/);
  await page.getByRole('button', { name: 'Allow' }).waitFor();
  await shot('it-asks-again');
};

export default journey;
