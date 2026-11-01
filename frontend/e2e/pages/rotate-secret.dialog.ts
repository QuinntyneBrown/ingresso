import { Locator, Page } from '@playwright/test';

/** "Rotate <name>'s secret?": asks before a confidential app's secret is replaced (L2-113). */
export class RotateSecretDialog {
  readonly dialog: Locator;
  readonly rotate: Locator;
  readonly rotating: Locator;
  readonly cancel: Locator;
  readonly failed: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: /^Rotate .* secret\?$/ });
    this.rotate = this.dialog.getByRole('button', { name: 'Rotate secret' });
    this.rotating = this.dialog.getByRole('button', { name: 'Rotating…' });
    this.cancel = this.dialog.getByRole('button', { name: 'Cancel' });
    this.failed = this.dialog.getByRole('alert').filter({ hasText: 'We couldn’t rotate the secret' });
  }

  /** Fails the next rotation with a server error. */
  async failNextRotation(): Promise<void> {
    await this.page.route('**/api/clients/*/secret', (route) => route.fulfill({ status: 500, json: {} }), {
      times: 1,
    });
  }

  /** Answers the next rotation with this secret, so a screenshot shows the same one every time. */
  async rotateTo(clientId: string, name: string, clientSecret: string): Promise<void> {
    await this.page.route(
      '**/api/clients/*/secret',
      (route) =>
        route.fulfill({
          json: {
            client: {
              clientId,
              name,
              redirectUris: [],
              postLogoutRedirectUris: [],
              scopes: [],
              frontChannelLogoutUri: null,
              confidential: true,
            },
            clientSecret,
          },
        }),
      { times: 1 },
    );
  }

  /** Holds the next rotation until the test ends, to look at the busy state. */
  async holdRotation(): Promise<void> {
    await this.page.route('**/api/clients/*/secret', () => new Promise(() => undefined));
  }
}
