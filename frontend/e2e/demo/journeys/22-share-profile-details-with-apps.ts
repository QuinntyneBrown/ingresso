import { createHash, randomBytes } from 'node:crypto';
import { request, type Page } from '@playwright/test';
import { SAMPLE_APP_URL } from '../../support/api-server';
import type { Journey } from '../scripts/run-journey';

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const base64Url = (bytes: Buffer) => bytes.toString('base64url');

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

/** Share profile details with apps: set a display name in Settings, and the sample app greets you by it. */
const journey: Journey = async ({ page, context, shot, baseURL }) => {
  const signedIn = await page.request.post(`${baseURL}/api/test/sign-in`, {
    data: { email: 'dev@ingresso.dev' },
  });
  if (!signedIn.ok()) throw new Error(`Demo sign-in failed: ${signedIn.status()}`);

  // 1. Settings → Profile.
  await page.goto(`${baseURL}/settings`);
  const profile = page.getByRole('region', { name: 'Profile' });
  await profile.getByRole('list', { name: 'Your profile' }).waitFor();
  await shot('settings-profile');

  // 2. Edit your profile.
  await profile.getByRole('button', { name: 'Edit profile' }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit your profile' });
  await dialog.getByLabel('Display name').fill('Maya Okafor-Reyes');
  await shot('edit-your-profile');

  // 3. Saved: the card and the header follow.
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await page.locator('ig-toast').filter({ hasText: 'Profile saved' }).waitFor();
  await profile.getByText('Maya Okafor-Reyes').waitFor();
  await page.mouse.move(40, 360);
  await shot('profile-saved');

  // 4. The sample app, before signing in.
  await page.goto(SAMPLE_APP_URL);
  await page.getByRole('link', { name: 'Sign in with ingresso' }).waitFor();
  await shot('the-sample-app');

  // 5. Signed in, it greets Maya by the name she set.
  await page.getByRole('link', { name: 'Sign in with ingresso' }).click();
  await page.locator('[data-greeting]').waitFor();
  await shot('greeted-by-name');

  // 6. What an app sees from the userinfo endpoint with openid profile email, and with openid alone.
  const userinfo = async (scope: string) => {
    const verifier = base64Url(randomBytes(32));
    const query = new URLSearchParams({
      client_id: 'ingresso-sample-app',
      redirect_uri: `${SAMPLE_APP_URL}/signin-oidc`,
      response_type: 'code',
      scope,
      code_challenge: base64Url(createHash('sha256').update(verifier).digest()),
      code_challenge_method: 'S256',
      state: 'demo',
    });
    const authorized = await context.request.get(`${baseURL}/connect/authorize?${query}`, {
      maxRedirects: 0,
    });
    const code = new URL(authorized.headers()['location']).searchParams.get('code')!;
    // The app calls the token and userinfo endpoints from its server, with no browser cookies.
    const server = await request.newContext();
    const tokens = await server.post(`${baseURL}/connect/token`, {
      form: {
        grant_type: 'authorization_code',
        client_id: 'ingresso-sample-app',
        redirect_uri: `${SAMPLE_APP_URL}/signin-oidc`,
        code,
        code_verifier: verifier,
      },
    });
    const body = (await tokens.json()) as { access_token?: string };
    if (!body.access_token) throw new Error(`Token exchange failed: ${JSON.stringify(body)}`);
    const accessToken = body.access_token;
    const answer = await server.get(`${baseURL}/connect/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const claims = await answer.json();
    await server.dispose();
    return (
      `# An access token for scope "${scope}"\n` +
      `$ curl ${baseURL}/connect/userinfo -H "Authorization: Bearer ${accessToken.slice(0, 16)}…"\n` +
      JSON.stringify(claims, null, 2)
    );
  };
  await terminal(
    page,
    'curl — the userinfo endpoint',
    `${await userinfo('openid profile email')}\n\n${await userinfo('openid')}`,
  );
  await shot('userinfo-by-scope');
};

export default journey;
