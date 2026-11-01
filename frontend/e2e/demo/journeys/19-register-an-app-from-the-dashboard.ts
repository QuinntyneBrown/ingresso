import { spawnSync } from 'node:child_process';
import type { Page } from '@playwright/test';
import { apiEnvironment } from '../../support/api-server';
import type { Journey } from '../scripts/run-journey';
import { REPO } from '../scripts/paths';

/** Runs the real CLI against the demo database and returns what it printed, as typed at a prompt. */
function cli(...args: string[]): string {
  const result = spawnSync(
    'dotnet',
    ['run', '--no-build', '--project', 'backend/src/Ingresso.Cli', '--', ...args],
    {
      cwd: REPO,
      env: apiEnvironment('demo'),
      encoding: 'utf8',
    },
  );
  return `$ ingresso ${args.join(' ')}\n${result.stdout}`;
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Shows terminal output in a terminal window on a 1280 × 720 canvas. */
async function terminal(page: Page, title: string, transcript: string): Promise<void> {
  await page.setContent(`<!doctype html>
<body style="margin:0;height:720px;display:grid;place-items:center;background:#eef1f6;font-family:system-ui,sans-serif">
  <div style="width:1160px;border-radius:12px;overflow:hidden;box-shadow:0 20px 48px rgb(0 0 0 / .25);background:#14171f">
    <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;background:#232733;color:#c9d1e0;font-size:14px">
      <span style="width:12px;height:12px;border-radius:50%;background:#ff5f57"></span>
      <span style="width:12px;height:12px;border-radius:50%;background:#febc2e"></span>
      <span style="width:12px;height:12px;border-radius:50%;background:#28c840"></span>
      <span style="margin-left:12px">${escape(title)}</span>
    </div>
    <pre style="margin:0;padding:24px 28px;min-height:200px;color:#e6edf7;font:18px/1.55 'SF Mono',Menlo,monospace;white-space:pre-wrap">${escape(transcript)}</pre>
  </div>
</body>`);
}

/** Register an app from the dashboard: become an administrator, then register a confidential app in Settings → Apps. */
const journey: Journey = async ({ page, context, shot, baseURL }) => {
  // 1. The CLI makes Maya an administrator.
  await terminal(
    page,
    'ingresso CLI — make an administrator',
    cli('users', 'grant-admin', '--email', 'dev@ingresso.dev'),
  );
  await shot('make-an-administrator');

  // 2. Settings now has the Apps card.
  const signedIn = await page.request.post(`${baseURL}/api/test/sign-in`, {
    data: { email: 'dev@ingresso.dev' },
  });
  if (!signedIn.ok()) throw new Error(`Demo sign-in failed: ${signedIn.status()}`);
  await page.goto(`${baseURL}/settings`);
  await page.getByRole('list', { name: 'Registered apps' }).waitFor();
  await shot('settings-apps');

  // 3. Register a confidential server app.
  await page.getByRole('button', { name: 'Register an app' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Register an app' });
  await dialog.getByLabel('Name', { exact: true }).fill('Budget');
  await dialog.getByLabel('Redirect addresses').fill('https://budget.example.com/signin-oidc');
  await dialog
    .getByLabel('Sign-out return addresses')
    .fill('https://budget.example.com/signout-callback-oidc');
  await dialog.getByRole('checkbox', { name: 'Sample API · sample-api.read' }).check();
  await dialog.getByRole('radio', { name: /^Confidential/ }).check();
  await shot('register-a-confidential-app');

  // 4. Its secret, shown once.
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await dialog.getByRole('button', { name: 'Register app' }).click();
  const secret = page.getByRole('dialog', { name: 'Budget is registered' });
  await secret.getByRole('button', { name: 'Copy client secret' }).click();
  await secret.getByRole('status').filter({ hasText: 'Client secret copied' }).waitFor();
  await shot('the-secret-shown-once');

  // 5. The new app in the list.
  await secret.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('listitem').filter({ hasText: 'Budget' }).waitFor();
  await shot('the-new-app-in-the-list');
};

export default journey;
