import { Locator, Page } from '@playwright/test';

/** "You're signed out": the page that signs the session's apps out in hidden frames, then lists them (journey 18). */
export class SignedOutPage {
  readonly heading: Locator;
  readonly apps: Locator;
  readonly signInAgain: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.apps = page.getByRole('list', { name: 'Apps signed out' }).getByRole('listitem');
    this.signInAgain = page.getByRole('link', { name: 'Sign in again' });
  }

  /** Keeps every app's front-channel sign-out request waiting, so the page stays on signing out. */
  async holdAppSignOuts(): Promise<void> {
    await this.page.route('**/frontchannel-logout**', () => new Promise(() => undefined));
  }

  async waitUntilShown(): Promise<void> {
    await this.page.waitForURL(/\/signed-out\?ticket=/);
  }
}
