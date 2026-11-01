import type { Page } from '@playwright/test';
import { SAMPLE_APP_URL } from '../../support/api-server';
import type { Journey } from '../scripts/run-journey';

/** Signs in to ingresso through the test seam, then to the sample app, which goes straight through. */
async function signInToTheSampleApp(page: Page, baseURL: string): Promise<void> {
  const signedIn = await page.request.post(`${baseURL}/api/test/sign-in`, {
    data: { email: 'dev@ingresso.dev' },
  });
  if (!signedIn.ok()) throw new Error(`Demo sign-in failed: ${signedIn.status()}`);
  await page.goto(SAMPLE_APP_URL);
  await page.getByRole('link', { name: 'Sign in with ingresso' }).click();
  await page.locator('[data-signed-in-as]').waitFor();
}

/** Sign out everywhere: signing out of ingresso signs out the apps, and signing out of an app signs out of ingresso. */
const journey: Journey = async ({ page, shot, baseURL }) => {
  // 1. Signed in to the sample app with ingresso.
  await signInToTheSampleApp(page, baseURL);
  await shot('signed-in-to-the-app');

  // 2. Sign out of ingresso from the dashboard.
  await page.goto(baseURL);
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await page.getByRole('dialog', { name: 'Sign out of ingresso?' }).waitFor();
  await shot('sign-out-of-ingresso');

  // 3. The signed-out page signs the sample app out too, and says so.
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.getByRole('list', { name: 'Apps signed out' }).waitFor();
  await shot('signed-out-of-every-app');

  // 4. The sample app's session has ended.
  await page.goto(SAMPLE_APP_URL);
  await page.getByRole('link', { name: 'Sign in with ingresso' }).waitFor();
  await shot('the-app-is-signed-out');

  // 5. Signing out in the app ends the ingresso session: ingresso asks you to sign in again.
  await signInToTheSampleApp(page, baseURL);
  await page.getByRole('link', { name: 'Sign out' }).click();
  await page.getByRole('link', { name: 'Sign in with ingresso' }).waitFor();
  await page.goto(baseURL);
  await page.waitForURL(/\/sign-in/);
  await page.getByRole('heading', { level: 1 }).waitFor();
  await shot('ingresso-is-signed-out-too');
};

export default journey;
