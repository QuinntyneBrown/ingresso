import { Locator, Page } from '@playwright/test';

/** The client secret dialog: a new confidential app's client ID and secret, shown once (L2-106). */
export class ClientSecretDialog {
  readonly dialog: Locator;
  readonly clientId: Locator;
  readonly secret: Locator;
  readonly copyClientId: Locator;
  readonly copySecret: Locator;
  readonly warning: Locator;
  readonly copied: Locator;
  readonly done: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: /is registered$/ });
    this.clientId = this.dialog.getByLabel('Client ID', { exact: true });
    this.secret = this.dialog.getByLabel('Client secret', { exact: true });
    this.copyClientId = this.dialog.getByRole('button', { name: 'Copy client ID' });
    this.copySecret = this.dialog.getByRole('button', { name: 'Copy client secret' });
    this.warning = this.dialog.getByText('You won’t see this secret again');
    this.copied = this.dialog.getByRole('status');
    this.done = this.dialog.getByRole('button', { name: 'Done' });
  }

  /** Lets the page write to and read from the clipboard, as a person's browser would after Copy. */
  async allowClipboard(): Promise<void> {
    await this.page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  }

  async clipboard(): Promise<string> {
    return this.page.evaluate(() => navigator.clipboard.readText());
  }
}
