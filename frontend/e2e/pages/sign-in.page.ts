import { expect, Locator, Page } from '@playwright/test';

/** The sign-in screen: ask for an emailed link, and what the page says about a link that was followed. */
export class SignInPage {
  readonly heading: Locator;
  readonly email: Locator;
  readonly emailMeALink: Locator;
  readonly emailError: Locator;
  readonly errorSummary: Locator;
  readonly useDifferentEmail: Locator;
  readonly sentMessage: Locator;
  readonly notice: Locator;
  readonly lead: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.email = page.getByLabel('Email', { exact: true });
    this.emailMeALink = page.getByRole('button', { name: /Email me a link|Sending/ });
    this.emailError = page.locator('#email-error');
    this.errorSummary = page.locator('ig-error-summary');
    this.useDifferentEmail = page.getByRole('button', { name: 'Use a different email' });
    this.sentMessage = page.locator('.auth-card__lead');
    this.notice = page.locator('ig-alert');
    this.lead = page.locator('.auth-card__lead');
  }

  /** Opens sign-in with no session; `link` is what the API appended after a refused link. */
  async open(link?: 'used' | 'expired' | 'invalid'): Promise<void> {
    await this.page.goto(link ? `/sign-in?link=${link}` : '/sign-in');
  }

  /** Opens an app address without a session. */
  async openWithoutSession(path = '/'): Promise<void> {
    await this.page.goto(path);
  }

  async waitUntilShown(): Promise<void> {
    await this.page.waitForURL(/\/sign-in(\?|$)/);
  }

  async requestLink(email: string): Promise<void> {
    await this.email.fill(email);
    await this.emailMeALink.click();
  }

  /** The newest sign-in link in the dev mailbox for this address, as a path the web app can open. */
  async linkFromMailbox(email: string): Promise<string> {
    let link = '';
    await expect
      .poll(async () => {
        const response = await this.page.request.get(`/api/dev/mailbox?to=${encodeURIComponent(email)}`);
        const [message] = (await response.json()) as { textBody: string }[];
        link = message?.textBody.match(/https?:\/\/[^\s]+\/auth\/redeem\?token=[^\s]+/)?.[0] ?? '';
        return link;
      })
      .not.toBe('');
    const url = new URL(link);
    return url.pathname + url.search;
  }

  async followLink(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /** Answers every link request with this status, to show states the API only reaches under load or failure. */
  async answerLinkRequestsWith(status: number): Promise<void> {
    await this.page.route('**/api/auth/sign-in-links', (route) =>
      route.fulfill({
        status,
        contentType: 'application/problem+json',
        body: '{}',
        headers: { 'Retry-After': '60' },
      }),
    );
  }
}
