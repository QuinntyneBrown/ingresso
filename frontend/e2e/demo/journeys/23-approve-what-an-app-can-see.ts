import { spawnSync } from 'node:child_process';
import type { Page } from '@playwright/test';
import { apiEnvironment, SAMPLE_APP_URL } from '../../support/api-server';
import type { Journey } from '../scripts/run-journey';
import { REPO } from '../scripts/paths';

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
  const typed = args.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ');
  return `$ ingresso ${typed}\n${result.stdout}`;
}

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
    <pre style="margin:0;padding:24px 28px;min-height:300px;color:#e6edf7;font:18px/1.55 'SF Mono',Menlo,monospace;white-space:pre-wrap">${escape(transcript)}</pre>
  </div>
</body>`);
}

/** Approve what an app can see: the consent page, Allow, and a second sign-in that doesn't ask. */
const journey: Journey = async ({ page, context, shot, baseURL }) => {
  const signedIn = await page.request.post(`${baseURL}/api/test/sign-in`, {
    data: { email: 'dev@ingresso.dev' },
  });
  if (!signedIn.ok()) throw new Error(`Demo sign-in failed: ${signedIn.status()}`);

  // 1. The sample app asks to sign in.
  await page.goto(SAMPLE_APP_URL);
  await page.getByRole('link', { name: 'Sign in with ingresso' }).waitFor();
  await shot('the-sample-app');

  // 2. ingresso asks first, in plain words.
  await page.getByRole('link', { name: 'Sign in with ingresso' }).click();
  await page.waitForURL(/\/consent\?/);
  await page.getByRole('button', { name: 'Allow' }).waitFor();
  await page.getByText('See your display name').waitFor();
  await shot('what-the-app-will-see');

  // 3. Allow, and back in the app.
  await page.getByRole('button', { name: 'Allow' }).click();
  await page.locator('[data-greeting]').waitFor();
  await shot('allowed-back-in-the-app');

  // 4. Signing in again doesn't ask: the choice is remembered.
  await context.clearCookies({ name: 'sample-app.session' });
  await page.goto(SAMPLE_APP_URL);
  await page.getByRole('link', { name: 'Sign in with ingresso' }).click();
  await page.locator('[data-greeting]').waitFor();
  await shot('not-asked-again');

  // 5. An app you run yourself can skip the page.
  await terminal(
    page,
    'ingresso CLI — first-party apps',
    cli(
      'clients',
      'add',
      '--name',
      'Budget',
      '--redirect-uri',
      'https://budget.example.com/signin-oidc',
      '--first-party',
    ) +
      '\n' +
      cli('clients', 'list')
        .split('\n')
        .filter((line, i, all) => !line.startsWith('  Redirect') || all[i - 1]?.startsWith('  First-party'))
        .slice(0, 12)
        .join('\n'),
  );
  await shot('first-party-apps-skip-it');
};

export default journey;
