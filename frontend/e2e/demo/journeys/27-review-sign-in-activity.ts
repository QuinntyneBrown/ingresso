import { spawnSync } from 'node:child_process';
import { apiEnvironment } from '../../support/api-server';
import type { Journey } from '../scripts/run-journey';
import { REPO } from '../scripts/paths';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';

/** Runs the real CLI against the demo database. */
function cli(...args: string[]): void {
  const result = spawnSync(
    'dotnet',
    ['run', '--no-build', '--project', 'backend/src/Ingresso.Cli', '--', ...args],
    {
      cwd: REPO,
      env: apiEnvironment('demo'),
      encoding: 'utf8',
    },
  );
  if (result.status !== 0) throw new Error(`CLI ${args.join(' ')} failed: ${result.stdout}${result.stderr}`);
}

/** Review sign-in activity: Settings → Activity lists sign-ins, an ended session and, for administrators, app changes. */
const journey: Journey = async ({ page, browser, shot, baseURL }) => {
  const email = 'dev@ingresso.dev';

  // The owner is an administrator.
  cli('users', 'grant-admin', '--email', email);

  // Signed in on a phone earlier; that session is ended from here, and an app is registered from the CLI.
  const phoneContext = await browser.newContext({ baseURL, userAgent: IPHONE_SAFARI });
  const onPhone = await phoneContext.request.post(`${baseURL}/api/test/sign-in`, { data: { email } });
  if (!onPhone.ok()) throw new Error(`Demo phone sign-in failed: ${onPhone.status()}`);
  await phoneContext.close();
  const signedIn = await page.request.post(`${baseURL}/api/test/sign-in`, { data: { email } });
  if (!signedIn.ok()) throw new Error(`Demo sign-in failed: ${signedIn.status()}`);
  await page.goto('/settings');
  const devices = page.getByRole('region', { name: 'Devices', exact: true });
  await devices.getByRole('button', { name: 'End the session on Safari on iPhone' }).click();
  await page
    .getByRole('dialog', { name: 'End the session on Safari on iPhone?' })
    .getByRole('button', { name: 'End session' })
    .click();
  await devices.getByText('You’re not signed in anywhere else.').waitFor();
  const toasts = page.locator('.toast-region');
  await toasts.getByRole('button', { name: 'Dismiss' }).click();
  await toasts.getByText('Session ended').waitFor({ state: 'hidden' });
  cli('clients', 'add', '--name', 'Notes', '--redirect-uri', 'http://localhost:5299/signin-oidc');

  // 1. Settings has an Activity card.
  const card = page.getByRole('region', { name: 'Activity', exact: true });
  await card.scrollIntoViewIfNeeded();
  await shot('the-activity-card');

  // 2. Activity lists security events, newest first.
  await card.getByRole('link', { name: 'View activity' }).click();
  const list = page.getByRole('list', { name: 'Activity' });
  await list.getByText('Ended the session on Safari on iPhone').waitFor();
  await shot('your-activity');

  // 3. Filter to sign-ins.
  const filters = page.getByRole('group', { name: 'Show' });
  await filters.getByRole('button', { name: 'Sign-ins', exact: true }).click();
  await list.getByText('Safari on iPhone', { exact: false }).first().waitFor();
  await shot('only-sign-ins');

  // 4. Administrators also see app and key changes.
  await filters.getByRole('button', { name: 'Apps and keys', exact: true }).click();
  await list.getByText('Registered Notes').waitFor();
  await shot('apps-and-keys');
};

export default journey;
