import { Locator, Page } from '@playwright/test';
import { SAMPLE_APP_URL } from '../support/api-server';

/** "Can't sign in to this app": an authorization request from an unknown app or an unregistered address. */
export class AuthorizeErrorPage {
  readonly heading: Locator;
  readonly goToYourApps: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.goToYourApps = page.getByRole('link', { name: 'Go to your apps' });
  }

  /** Sends an authorization request from a client ingresso does not know. */
  async openForUnknownApp(): Promise<void> {
    await this.openForApp('not-a-registered-app', `${SAMPLE_APP_URL}/signin-oidc`);
  }

  /** Sends an authorization request from this app and waits for the error page, as for a disabled app (L2-114). */
  async openForApp(clientId: string, redirectUri: string): Promise<void> {
    const query = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid',
      code_challenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
      code_challenge_method: 'S256',
    });
    await this.page.goto(`/connect/authorize?${query}`);
    await this.page.waitForURL(/\/authorize-error$/);
  }

  /** Opens the page directly, as the API sends people there; `sign-out` for a refused end-session request. */
  async open(flow?: 'sign-out'): Promise<void> {
    await this.page.goto(flow ? `/authorize-error?flow=${flow}` : '/authorize-error');
  }
}
