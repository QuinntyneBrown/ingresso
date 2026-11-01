import { Locator, Page } from '@playwright/test';
import { SAMPLE_APP_URL } from '../support/api-server';

/** The sample relying party (backend/samples/Ingresso.SampleApp): an app that signs people in with ingresso. */
export class SampleAppPage {
  readonly heading: Locator;
  readonly signInWithIngresso: Locator;
  readonly signedInAs: Locator;
  /** "Hello, <name>": the display name with the profile scope, else the email (L2-118). */
  readonly greeting: Locator;
  /** What the sample app's own API answered, called with the person's access token (journey 17). */
  readonly apiResult: Locator;
  readonly signOut: Locator;
  /** Says how many times the app renewed its access token without the person signing in again (journey 20). */
  readonly renewals: Locator;
  /** Shown when the app's renewal was refused and the person must sign in again (L2-110). */
  readonly sessionEnded: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.signInWithIngresso = page.getByRole('link', { name: 'Sign in with ingresso' });
    this.signedInAs = page.locator('[data-signed-in-as]');
    this.greeting = page.locator('[data-greeting]');
    this.apiResult = page.locator('[data-api-result]');
    this.signOut = page.getByRole('link', { name: 'Sign out' });
    this.renewals = page.locator('[data-token-renewals]');
    this.sessionEnded = page.getByText('Your ingresso session has ended. Sign in again.');
  }

  async open(): Promise<void> {
    await this.page.goto(SAMPLE_APP_URL);
  }

  /** Waits until the browser is back on the sample app. */
  async waitUntilShown(): Promise<void> {
    await this.page.waitForURL((url) => url.origin === new URL(SAMPLE_APP_URL).origin);
  }

  /**
   * Reopens the app every second until its access token has expired and it has done something about it: renewed it,
   * or been refused. Playwright's API runs with a 5-second access token lifetime.
   */
  async reopenUntilTheAccessTokenExpires(): Promise<void> {
    for (let attempt = 0; attempt < 20; attempt++) {
      await this.open();
      if ((await this.renewals.count()) > 0 || (await this.sessionEnded.count()) > 0) return;
      await this.page.waitForTimeout(1000);
    }
    throw new Error('The sample app never renewed or lost its access token.');
  }
}
