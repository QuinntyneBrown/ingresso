import { SAMPLE_APP_URL } from '../../support/api-server';
import type { Journey } from '../scripts/run-journey';

/** Stay signed in to an app: the sample app renews its access token quietly, until the ingresso session ends. */
const journey: Journey = async ({ page, shot, baseURL }) => {
  // 1. The sample app, signed in and calling its API.
  const signedIn = await page.request.post(`${baseURL}/api/test/sign-in`, {
    data: { email: 'dev@ingresso.dev' },
  });
  if (!signedIn.ok()) throw new Error(`Demo sign-in failed: ${signedIn.status()}`);
  await page.goto(SAMPLE_APP_URL);
  await page.getByRole('link', { name: 'Sign in with ingresso' }).click();
  await page.locator('[data-api-result]').waitFor();
  await shot('signed-in-and-calling-its-api');

  // 2. The access token expires (5 seconds in the demo); the app renews it with its refresh token.
  await page.waitForTimeout(6000);
  await page.goto(SAMPLE_APP_URL);
  await page.locator('[data-token-renewals]').waitFor();
  await shot('renewed-quietly');

  // 3. The ingresso session ends; the next renewal is refused and the app asks to sign in again.
  const xsrf = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN')?.value ?? '';
  const ended = await page.request.post(`${baseURL}/api/auth/sign-out`, {
    headers: { 'X-XSRF-TOKEN': xsrf },
  });
  if (!ended.ok()) throw new Error(`Ending the session failed: ${ended.status()}`);
  await page.waitForTimeout(6000);
  await page.goto(SAMPLE_APP_URL);
  await page.getByText('Your ingresso session has ended. Sign in again.').waitFor();
  await shot('sign-in-again-after-the-session-ends');
};

export default journey;
