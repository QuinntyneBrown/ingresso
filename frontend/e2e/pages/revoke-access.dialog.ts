import { Locator, Page } from '@playwright/test';

/** "Revoke <app>'s access?": asks before a connected app's access is revoked (L2-129). */
export class RevokeAccessDialog {
  readonly dialog: Locator;
  readonly revoke: Locator;
  readonly revoking: Locator;
  readonly cancel: Locator;
  readonly failed: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: /^Revoke .* access\?$/ });
    this.revoke = this.dialog.getByRole('button', { name: 'Revoke access' });
    this.revoking = this.dialog.getByRole('button', { name: 'Revoking…' });
    this.cancel = this.dialog.getByRole('button', { name: 'Cancel' });
    this.failed = this.dialog.getByRole('alert').filter({ hasText: 'We couldn’t revoke access' });
  }

  /** Fails the next revoke with a server error. */
  async failNextRevoke(): Promise<void> {
    let pending = true;
    await this.page.route('**/api/connected-apps/*', (route) => {
      if (!pending || route.request().method() !== 'DELETE') return route.fallback();
      pending = false;
      return route.fulfill({ status: 500, json: {} });
    });
  }

  /** Keeps the next revoke waiting, to show the busy state. */
  async holdRevoke(): Promise<void> {
    await this.page.route('**/api/connected-apps/*', (route) =>
      route.request().method() === 'DELETE' ? undefined : route.fallback(),
    );
  }
}
