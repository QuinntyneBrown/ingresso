import type { Journey } from '../scripts/run-journey';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';

/** See and end other sessions: Devices lists a phone too; end its session, and the phone is back at sign-in. */
const journey: Journey = async ({ page, browser, shot, baseURL }) => {
  const email = 'dev@ingresso.dev';
  const signedIn = await page.request.post(`${baseURL}/api/test/sign-in`, { data: { email } });
  if (!signedIn.ok()) throw new Error(`Demo sign-in failed: ${signedIn.status()}`);

  // The same person, signed in on a phone too.
  const phoneContext = await browser.newContext({
    baseURL,
    userAgent: IPHONE_SAFARI,
    viewport: { width: 390, height: 844 },
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'UTC',
  });
  const phone = await phoneContext.newPage();
  const onPhone = await phone.request.post(`${baseURL}/api/test/sign-in`, { data: { email } });
  if (!onPhone.ok()) throw new Error(`Demo phone sign-in failed: ${onPhone.status()}`);
  await phone.goto('/');
  await phone.getByRole('heading', { level: 1 }).waitFor();

  // 1. Settings → Devices lists this computer and the phone.
  await page.goto('/settings');
  const card = page.getByRole('region', { name: 'Devices', exact: true });
  await card.getByRole('button', { name: 'End the session on Safari on iPhone' }).waitFor();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot('your-devices');

  // 2. End session asks first, naming the phone.
  await card.getByRole('button', { name: 'End the session on Safari on iPhone' }).click();
  const dialog = page.getByRole('dialog', { name: 'End the session on Safari on iPhone?' });
  await dialog.getByRole('button', { name: 'End session' }).waitFor();
  await shot('end-session-asks-first');

  // 3. Ended: a toast, and only this device is left.
  await dialog.getByRole('button', { name: 'End session' }).click();
  await page.locator('.toast-region').getByText('Session ended').waitFor();
  await card.getByText('You’re not signed in anywhere else.').waitFor();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot('session-ended');

  // 4. The phone's next step takes it back to sign-in.
  await phone.reload();
  await phone.getByRole('heading', { name: 'Sign in to ingresso' }).waitFor();
  await shot('the-phone-is-signed-out', { page: phone, phone: true });
  await phoneContext.close();
};

export default journey;
