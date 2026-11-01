import { spawnSync } from 'node:child_process';
import type { Page } from '@playwright/test';
import { apiEnvironment, SAMPLE_APP_URL } from '../../support/api-server';
import type { Journey } from '../scripts/run-journey';
import { REPO } from '../scripts/paths';

/** Runs the real CLI against the demo database and returns what it printed, as typed at a prompt. */
function cli(...args: string[]): string {
  const result = spawnSync(
    'dotnet',
    ['run', '--no-build', '--project', 'backend/src/Ingresso.Cli', '--', ...args],
    { cwd: REPO, env: apiEnvironment('demo'), encoding: 'utf8' },
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
    <pre style="margin:0;padding:24px 28px;min-height:360px;color:#e6edf7;font:18px/1.55 'SF Mono',Menlo,monospace;white-space:pre-wrap">${escape(transcript)}</pre>
  </div>
</body>`);
}

/** The key ids the JWKS publishes. */
async function publishedKids(page: Page, baseURL: string): Promise<string[]> {
  const jwks = (await (await page.request.get(`${baseURL}/.well-known/jwks`)).json()) as {
    keys: { kid: string }[];
  };
  return jwks.keys.map((k) => k.kid);
}

/** Rotate signing keys: list the keys, rotate, see both published, and the signed-in app keeps working. */
const journey: Journey = async ({ page, context, shot, baseURL }) => {
  // Sign in to the sample app before the rotation; it calls its API with ingresso access tokens.
  const signedIn = await page.request.post(`${baseURL}/api/test/sign-in`, {
    data: { email: 'dev@ingresso.dev' },
  });
  if (!signedIn.ok()) throw new Error(`Demo sign-in failed: ${signedIn.status()}`);
  await page.goto(SAMPLE_APP_URL);
  await page.getByRole('link', { name: 'Sign in with ingresso' }).click();
  await page.locator('[data-api-result]').waitFor();

  // 1. The keys ingresso signs tokens with.
  await terminal(page, 'ingresso CLI — signing keys', cli('keys', 'list'));
  await shot('the-signing-keys');

  // 2. Rotate; within the API's key check, the JWKS publishes the new key and the retiring one.
  const rotated = cli('keys', 'rotate');
  const active = rotated.match(/Active key: (\w+)/)![1];
  let kids: string[] = [];
  for (let i = 0; i < 40 && !kids.includes(active); i++) {
    await page.waitForTimeout(250);
    kids = await publishedKids(page, baseURL);
  }
  if (!kids.includes(active)) throw new Error('The API did not publish the new key');
  await terminal(
    page,
    'ingresso CLI — rotate',
    `${rotated}\n$ curl -s ${baseURL}/.well-known/jwks | jq '.keys[].kid'\n${kids.map((k) => `"${k}"`).join('\n')}`,
  );
  await shot('rotate-and-publish-both-keys');

  // 3. The sample app, still signed in, renews its token (now signed with the new key) and calls its API.
  await page.waitForTimeout(6000);
  await page.goto(SAMPLE_APP_URL);
  await page.locator('[data-api-result]').waitFor();
  await shot('the-app-keeps-working');
  void context;
};

export default journey;
