import { Locator, Page } from '@playwright/test';
import { signInAs } from '../support/session';

/** A full-page status message: not found, forbidden, server error or offline. */
export class StatusPage {
  readonly heading: Locator;
  readonly message: Locator;
  readonly backToApps: Locator;
  readonly tryAgain: Locator;
  readonly code: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.message = page.locator('.status-page__message');
    this.backToApps = page.getByRole('link', { name: 'Back to your apps' });
    this.tryAgain = page.getByRole('button', { name: 'Try again' });
    this.code = page.locator('.status-page__code');
  }

  async open(path: string): Promise<void> {
    await signInAs(this.page);
    await this.page.goto(path);
  }
}
