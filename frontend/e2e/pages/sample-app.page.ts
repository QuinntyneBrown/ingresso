import { Locator, Page } from '@playwright/test';
import { SAMPLE_APP_URL } from '../support/api-server';

/** The sample relying party (backend/samples/Ingresso.SampleApp): an app that signs people in with ingresso. */
export class SampleAppPage {
  readonly heading: Locator;
  readonly signInWithIngresso: Locator;
  readonly signedInAs: Locator;
  /** What the sample app's own API answered, called with the person's access token (journey 17). */
  readonly apiResult: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.signInWithIngresso = page.getByRole('link', { name: 'Sign in with ingresso' });
    this.signedInAs = page.locator('[data-signed-in-as]');
    this.apiResult = page.locator('[data-api-result]');
  }

  async open(): Promise<void> {
    await this.page.goto(SAMPLE_APP_URL);
  }

  /** Waits until the browser is back on the sample app. */
  async waitUntilShown(): Promise<void> {
    await this.page.waitForURL((url) => url.origin === new URL(SAMPLE_APP_URL).origin);
  }
}
