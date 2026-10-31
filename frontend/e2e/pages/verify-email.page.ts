import { expect, Locator, Page } from '@playwright/test';

/** The screen an unverified account is sent to: why, and a button for another verification email. */
export class VerifyEmailPage {
  readonly heading: Locator;
  readonly sendAnother: Locator;
  readonly sending: Locator;
  readonly signOut: Locator;
  readonly sent: Locator;
  readonly rateLimited: Locator;
  readonly failed: Locator;
  readonly linkInvalid: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Verify your email' });
    this.sendAnother = page.getByRole('button', { name: 'Send another email' });
    this.sending = page.getByRole('button', { name: 'Sending…' });
    this.signOut = page.getByRole('button', { name: 'Sign out' });
    this.sent = page.getByRole('status').filter({ hasText: 'Email sent' });
    this.rateLimited = page.getByRole('alert').filter({ hasText: 'Too many emails' });
    this.failed = page.getByRole('alert').filter({ hasText: 'We couldn’t send the email' });
    this.linkInvalid = page.getByRole('alert').filter({ hasText: 'That link didn’t work' });
  }

  /** The newest verification link in the dev mailbox for this address, as a path the web app can open. */
  async linkFromMailbox(email: string): Promise<string> {
    let link = '';
    await expect
      .poll(async () => {
        const response = await this.page.request.get(`/api/dev/mailbox?to=${encodeURIComponent(email)}`);
        const messages: { subject: string; textBody: string }[] = await response.json();
        const body = messages.find((m) => m.subject === 'Verify your email')?.textBody ?? '';
        link = /\/auth\/verify-email\?token=\S+/.exec(body)?.[0] ?? '';
        return link;
      })
      .not.toBe('');
    return link;
  }
}
