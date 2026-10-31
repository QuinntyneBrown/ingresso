import type { Journey } from '../scripts/run-journey';

/** Verify an email address: the explanation screen, another email, and following its link. */
const journey: Journey = async ({ page, shot }) => {
  const email = `newcomer-${Date.now()}@example.com`;
  const response = await page.request.post('/api/test/sign-in', { data: { email, createUnverified: true } });
  if (!response.ok()) throw new Error(`Test sign-in failed: ${response.status()}`);

  await page.goto('/');
  await page.getByRole('heading', { level: 1, name: 'Verify your email' }).waitFor();
  await shot('verify-your-email');

  await page.getByRole('button', { name: 'Send another email' }).click();
  await page.getByRole('status').filter({ hasText: 'Email sent' }).waitFor();
  await shot('email-sent');

  let link = '';
  for (let i = 0; i < 20 && !link; i++) {
    const mail = await page.request.get(`/api/dev/mailbox?to=${encodeURIComponent(email)}`);
    const messages: { subject: string; textBody: string }[] = await mail.json();
    link =
      /\/auth\/verify-email\?token=\S+/.exec(
        messages.find((m) => m.subject === 'Verify your email')?.textBody ?? '',
      )?.[0] ?? '';
    if (!link) await page.waitForTimeout(250);
  }
  await page.goto(link);
  await page.getByText('Email verified', { exact: true }).waitFor();
  await shot('email-verified');
};

export default journey;
