import type { Journey } from '../scripts/run-journey';

/** Sign in with an email link: ask for a link, open it from the dev mailbox, land on the dashboard, reuse the link. */
const journey: Journey = async ({ page, shot }) => {
  const email = 'maya@northwind.com';

  await page.goto('/sign-in');
  await page.getByRole('heading', { name: 'Sign in to ingresso' }).waitFor();
  await shot('sign-in');

  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByRole('button', { name: 'Email me a link' }).click();
  await page.getByRole('heading', { name: 'Check your inbox' }).waitFor();
  await shot('check-your-inbox');

  // The dev mailbox stands in for the inbox; the link is the one in the email.
  let link = '';
  for (let i = 0; i < 40 && !link; i++) {
    const response = await page.request.get(`/api/dev/mailbox?to=${encodeURIComponent(email)}`);
    const [message] = (await response.json()) as { textBody: string }[];
    link = message?.textBody.match(/https?:\/\/[^\s]+\/auth\/redeem\?token=[^\s]+/)?.[0] ?? '';
    if (!link) await page.waitForTimeout(500);
  }
  if (!link) throw new Error('No sign-in email arrived in the dev mailbox.');
  const url = new URL(link);
  const path = url.pathname + url.search;

  await page.goto(path);
  await page.getByRole('heading', { level: 1, name: /^Hi\b/ }).waitFor();
  await shot('private-dashboard');

  await page.context().clearCookies();
  await page.goto(path);
  await page.getByText('That link was already used').waitFor();
  await shot('link-already-used');
};

export default journey;
