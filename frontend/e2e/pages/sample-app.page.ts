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
  /** What the app says when the person chose Deny on ingresso's consent page (L2-124). */
  readonly denied: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.signInWithIngresso = page.getByRole('link', { name: 'Sign in with ingresso' });
    this.signedInAs = page.locator('[data-signed-in-as]');
    this.greeting = page.locator('[data-greeting]');
    this.apiResult = page.locator('[data-api-result]');
    this.signOut = page.getByRole('link', { name: 'Sign out' });
    this.renewals = page.locator('[data-token-renewals]');
    this.sessionEnded = page.getByText('Your ingresso session has ended. Sign in again.');
    this.denied = page.getByText('You chose not to let Sample app use your ingresso account.');
  }

  async open(): Promise<void> {
    await this.page.goto(SAMPLE_APP_URL);
  }

  /** Waits until the browser is back on the sample app, failing if ingresso shows anything on the way. */
  async waitUntilShown(): Promise<void> {
    await this.page.waitForURL((url) => url.origin === new URL(SAMPLE_APP_URL).origin);
  }

  /**
   * Waits until the browser is back on the sample app signed in, choosing Allow on the way when ingresso asks what
   * the app may see (journey 23). For tests whose subject is not consent.
   */
  async waitUntilSignedIn(): Promise<void> {
    const sample = new URL(SAMPLE_APP_URL).origin;
    await this.page.waitForURL((url) => url.origin === sample || url.pathname === '/consent');
    if (new URL(this.page.url()).origin !== sample) {
      await this.page.getByRole('button', { name: 'Allow' }).click();
      await this.waitUntilShown();
    }
  }

  /** Forgets the sample app's own session, keeping ingresso's, as signing out of the app alone would. */
  async forgetItsSession(): Promise<void> {
    await this.page.context().clearCookies({ name: 'sample-app.session' });
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
