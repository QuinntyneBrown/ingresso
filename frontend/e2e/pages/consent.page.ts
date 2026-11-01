import { Locator, Page } from '@playwright/test';

/** "Approve an app": what an app asks to see, with Allow and Deny (L2-121 to L2-125). */
export class ConsentPage {
  readonly heading: Locator;
  readonly lead: Locator;
  /** The plain-language title of each scope asked for, in order. */
  readonly scopeTitles: Locator;
  /** "You already let it see …", on the new-scopes page. */
  readonly approvedBefore: Locator;
  readonly allow: Locator;
  readonly deny: Locator;
  readonly failed: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.lead = page.getByText('Signed in as ');
    this.scopeTitles = page.getByRole('list', { name: /^What .+ asks for$/ }).locator('.list__title');
    this.approvedBefore = page.getByText('You already let it ');
    this.allow = page.getByRole('button', { name: /^Allow/ });
    this.deny = page.getByRole('button', { name: 'Deny' });
    this.failed = page.getByRole('alert').filter({ hasText: 'We couldn’t save your choice' });
  }

  async waitUntilShown(): Promise<void> {
    await this.page.waitForURL(/\/consent\?/);
    await this.allow.waitFor();
  }

  /** Fails the next Allow with a server error. */
  async failNextAllow(): Promise<void> {
    let pending = true;
    await this.page.route('**/api/consent', (route) => {
      if (!pending || route.request().method() !== 'POST') return route.fallback();
      pending = false;
      return route.fulfill({ status: 500, json: {} });
    });
  }
}
