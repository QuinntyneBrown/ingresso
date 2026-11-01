import type { Page } from '@playwright/test';
import type { Journey } from '../scripts/run-journey';

/** Follows the newest sign-in link in the dev mailbox, as opening the email would. */
async function signInWithEmailLink(page: Page, email: string): Promise<void> {
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByRole('button', { name: 'Email me a link' }).click();
  await page.getByRole('heading', { name: 'Check your inbox' }).waitFor();
  let link = '';
  for (let i = 0; i < 40 && !link; i++) {
    const response = await page.request.get(`/api/dev/mailbox?to=${encodeURIComponent(email)}`);
    const messages = (await response.json()) as { textBody: string }[];
    link = messages.at(-1)?.textBody.match(/https?:\/\/[^\s]+\/auth\/redeem\?token=[^\s]+/)?.[0] ?? '';
    if (!link) await page.waitForTimeout(500);
  }
  if (!link) throw new Error('No sign-in email arrived in the dev mailbox.');
  const url = new URL(link);
  await page.goto(url.pathname + url.search);
}

/** Greet by profile name: "Hi there" until a name is saved, then "Hi, {name}" at once and after signing in again. */
const journey: Journey = async ({ page, shot, baseURL }) => {
  // A new, verified account with no display name. The test seam creates verified accounts as administrators.
  const email = 'sam.rivera@northwind.example';
  const signedIn = await page.request.post(`${baseURL}/api/test/sign-in`, {
    data: { email, administrator: true },
  });
  if (!signedIn.ok()) throw new Error(`Demo sign-in failed: ${signedIn.status()}`);
  const heading = page.getByRole('heading', { level: 1 });
  const addYourName = page.locator('.intro').getByRole('button', { name: 'Add your name' });

  // 1. A new account's dashboard says "Hi there", never the email, and offers Add your name.
  await page.goto('/');
  await heading.filter({ hasText: 'Hi there' }).waitFor();
  await page.getByRole('heading', { name: 'No apps behind this door yet' }).waitFor();
  await shot('hi-there');

  // 2. Add your name opens Edit your profile.
  await addYourName.click();
  const dialog = page.getByRole('dialog', { name: 'Edit your profile' });
  await dialog.getByLabel('Display name').fill('Sam Rivera');
  await shot('add-your-name');

  // 3. Saving greets the person by the new name at once, without a reload.
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await heading.filter({ hasText: 'Hi, Sam Rivera' }).waitFor();
  await page.locator('ig-toast').filter({ hasText: 'Profile saved' }).waitFor();
  await shot('hi-sam');

  // 4. On a phone the greeting fits the screen; long names wrap instead of scrolling sideways.
  await page.locator('.toast-region').getByRole('button', { name: 'Dismiss' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await heading.filter({ hasText: 'Hi, Sam Rivera' }).waitFor();
  await shot('on-a-phone', { phone: true });
  await page.setViewportSize({ width: 1280, height: 720 });

  // 5. Settings → Profile shows the name and, separately, the email.
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Settings' }).click();
  const profile = page.getByRole('region', { name: 'Profile' });
  await profile.getByText('Sam Rivera').waitFor();
  await shot('settings-profile');

  // 6. Signing out and in again keeps the greeting.
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await page
    .getByRole('dialog', { name: 'Sign out of ingresso?' })
    .getByRole('button', { name: 'Sign out' })
    .click();
  await page.getByRole('heading', { name: 'Sign in to ingresso' }).waitFor();
  await signInWithEmailLink(page, email);
  await heading.filter({ hasText: 'Hi, Sam Rivera' }).waitFor();
  await page.getByRole('heading', { name: 'No apps behind this door yet' }).waitFor();
  await shot('signed-in-again');
};

export default journey;
