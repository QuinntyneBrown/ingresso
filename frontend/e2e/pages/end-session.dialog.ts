import { Locator, Page } from '@playwright/test';

/** "End the session on <device>?" or "Sign out of all other devices?": asks before sessions end (L2-133, L2-134). */
export class EndSessionDialog {
  readonly dialog: Locator;
  readonly endSession: Locator;
  readonly signOutOthers: Locator;
  readonly ending: Locator;
  readonly cancel: Locator;
  readonly failed: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog', {
      name: /^(End the session on .*|Sign out of all other devices)\?$/,
    });
    this.endSession = this.dialog.getByRole('button', { name: 'End session' });
    this.signOutOthers = this.dialog.getByRole('button', { name: 'Sign out other devices' });
    this.ending = this.dialog.getByRole('button', { name: 'Ending…' });
    this.cancel = this.dialog.getByRole('button', { name: 'Cancel' });
    this.failed = this.dialog.getByRole('alert').filter({ hasText: 'We couldn’t end the session' });
  }

  /** Fails the next end-session request with a server error. */
  async failNextEnd(): Promise<void> {
    let pending = true;
    await this.page.route('**/api/sessions/*', (route) => {
      if (!pending || route.request().method() !== 'DELETE') return route.fallback();
      pending = false;
      return route.fulfill({ status: 500, json: {} });
    });
  }

  /** Keeps the next end-session request waiting, to show the busy state. */
  async holdEnd(): Promise<void> {
    await this.page.route('**/api/sessions/*', (route) =>
      route.request().method() === 'DELETE' ? undefined : route.fallback(),
    );
  }
}
