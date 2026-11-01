import { SAMPLE_APP_URL } from '../../support/api-server';
import type { Journey } from '../scripts/run-journey';

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Sign in to an app with ingresso: the sample app, ingresso's sign-in naming it, the email link, and back. */
const journey: Journey = async ({ page, context, shot, baseURL }) => {
  const email = 'maya@northwind.com';

  await page.goto(SAMPLE_APP_URL);
  await page.getByRole('link', { name: 'Sign in with ingresso' }).waitFor();
  await shot('the-sample-app');

  await page.getByRole('link', { name: 'Sign in with ingresso' }).click();
  await page.getByRole('heading', { name: 'Sign in to continue to Sample app' }).waitFor();
  await page.getByLabel('Email', { exact: true }).fill(email);
  await shot('ingresso-names-the-app');

  await page.getByRole('button', { name: 'Email me a link' }).click();
  await page.getByRole('heading', { name: 'Check your inbox' }).waitFor();
  await shot('check-your-inbox');

  // Show the email from the dev mailbox as a mail client would.
  let body = '';
  for (let i = 0; i < 40 && !body; i++) {
    const response = await page.request.get(`${baseURL}/api/dev/mailbox?to=${encodeURIComponent(email)}`);
    const [message] = (await response.json()) as { textBody: string }[];
    body = message?.textBody ?? '';
    if (!body) await page.waitForTimeout(250);
  }
  const link = body.match(/https?:\/\/[^\s]+\/auth\/redeem\?token=[^\s]+/)![0];
  const mail = await context.newPage();
  await mail.setContent(`<!doctype html>
<body style="margin:0;height:720px;display:grid;place-items:center;background:#eef1f6;font:18px/1.6 system-ui,sans-serif;color:#1d2433">
  <div style="width:880px;border-radius:12px;background:#fff;box-shadow:0 20px 48px rgb(0 0 0 / .15);overflow:hidden">
    <div style="padding:20px 28px;border-bottom:1px solid #e4e7ee">
      <div style="font-size:22px;font-weight:600">Your ingresso sign-in link</div>
      <div style="color:#5b6478">To ${escape(email)}</div>
    </div>
    <div style="padding:24px 28px">
      <p style="margin:0 0 16px">Open this link to sign in to ingresso. It works once and expires in 15 minutes:</p>
      <p style="margin:0;color:#c2410c;word-break:break-all">${escape(link.slice(0, 72))}…</p>
    </div>
  </div>
</body>`);
  await shot('the-email-link', { page: mail });
  await mail.close();

  const url = new URL(link);
  await page.goto(`${baseURL}${url.pathname}${url.search}`);
  await page.waitForURL((u) => u.origin === new URL(SAMPLE_APP_URL).origin);
  await page.locator('[data-signed-in-as]').waitFor();
  await shot('signed-in-to-the-app');

  // Sign out of the sample app only; the ingresso session stays, so signing in again goes straight through.
  await context.clearCookies({ name: 'sample-app.session' });
  await page.goto(SAMPLE_APP_URL);
  await page.getByRole('link', { name: 'Sign in with ingresso' }).click();
  await page.locator('[data-signed-in-as]').waitFor();
  await shot('straight-back-in');
};

export default journey;
