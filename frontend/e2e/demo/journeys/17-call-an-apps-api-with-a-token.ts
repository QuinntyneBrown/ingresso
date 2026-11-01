import { spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
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
  const typed = args.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ');
  return `$ ingresso ${typed}\n${result.stdout}`;
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const base64Url = (bytes: Buffer) => bytes.toString('base64url');
/** The audience a JWT access token names, read from its payload. */
const audienceOf = (jwt: string) =>
  (JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString()) as { aud: string | string[] }).aud;

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

/** Call an app's API with a token: register APIs, see the sample app call its API, and see another API's token refused. */
const journey: Journey = async ({ page, context, shot, baseURL }) => {
  // 1. The sample API is registered by seed; register a second API and an app allowed its scope.
  const notesRedirect = 'http://localhost:5299/signin-oidc';
  const registered = cli(
    'resources',
    'add',
    '--name',
    'Notes API',
    '--audience',
    'notes-api',
    '--scope',
    'notes.read',
  );
  const notesApp = cli(
    'clients',
    'add',
    '--name',
    'Notes',
    '--redirect-uri',
    notesRedirect,
    '--scope',
    'notes.read',
  );
  const notesClientId = notesApp.match(/Client ID: (\w+)/)![1];
  await terminal(page, 'ingresso CLI — register APIs', `${registered}\n${cli('resources', 'list')}`);
  await shot('register-apis-and-scopes');

  // 2. Sign in to the sample app; it calls its API with the access token and shows the answer.
  const signedIn = await page.request.post(`${baseURL}/api/test/sign-in`, {
    data: { email: 'dev@ingresso.dev' },
  });
  if (!signedIn.ok()) throw new Error(`Demo sign-in failed: ${signedIn.status()}`);
  await page.goto(SAMPLE_APP_URL);
  await page.getByRole('link', { name: 'Sign in with ingresso' }).click();
  await page.locator('[data-api-result]').waitFor();
  await shot('the-app-calls-its-api');

  // 3. A token ingresso issued for Notes API, sent to the sample API, is refused.
  const verifier = base64Url(randomBytes(32));
  const challenge = base64Url(createHash('sha256').update(verifier).digest());
  const authorize = new URLSearchParams({
    client_id: notesClientId,
    redirect_uri: notesRedirect,
    response_type: 'code',
    scope: 'openid notes.read',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state: 'demo',
  });
  const authorized = await context.request.get(`${baseURL}/connect/authorize?${authorize}`, {
    maxRedirects: 0,
  });
  const code = new URL(authorized.headers()['location']).searchParams.get('code')!;
  const tokens = await context.request.post(`${baseURL}/connect/token`, {
    form: {
      grant_type: 'authorization_code',
      client_id: notesClientId,
      redirect_uri: notesRedirect,
      code,
      code_verifier: verifier,
    },
  });
  const notesToken = ((await tokens.json()) as { access_token: string }).access_token;
  const refused = await fetch(`${SAMPLE_APP_URL}/api/me`, {
    headers: { Authorization: `Bearer ${notesToken}` },
  });
  await terminal(
    page,
    'curl — a token for another API',
    `${notesApp}\n# An access token ingresso issued to Notes, for aud: ${audienceOf(notesToken)}\n` +
      `$ curl -i ${SAMPLE_APP_URL}/api/me -H "Authorization: Bearer ${notesToken.slice(0, 24)}…"\n` +
      `HTTP/1.1 ${refused.status} ${refused.statusText}\n` +
      `WWW-Authenticate: ${refused.headers.get('www-authenticate')?.split(', error_description')[0]}`,
  );
  await shot('another-apis-token-refused');
};

export default journey;
