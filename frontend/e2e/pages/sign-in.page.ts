import { Page } from '@playwright/test';

/** The sign-in screen, as far as the platform needs it: where anonymous visitors are sent. */
export class SignInPage {
  constructor(private readonly page: Page) {}

  /** Opens an app address without a session. */
  async openWithoutSession(path = '/'): Promise<void> {
    await this.page.goto(path);
  }

  async waitUntilShown(): Promise<void> {
    await this.page.waitForURL('**/sign-in');
  }
}
