import { Locator, Page } from '@playwright/test';

/** "Edit your profile": the display name, with the email shown as text (L2-117, ADR 0017). */
export class EditProfileDialog {
  readonly dialog: Locator;
  readonly displayName: Locator;
  readonly email: Locator;
  readonly summary: Locator;
  readonly save: Locator;
  readonly saving: Locator;
  readonly cancel: Locator;
  readonly failed: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Edit your profile' });
    this.displayName = this.dialog.getByLabel('Display name');
    this.email = this.dialog.getByText(/Your email can’t be changed here\./);
    this.summary = this.dialog.getByRole('alert').filter({ hasText: 'before you continue' });
    this.save = this.dialog.getByRole('button', { name: 'Save changes' });
    this.saving = this.dialog.getByRole('button', { name: 'Saving…' });
    this.cancel = this.dialog.getByRole('button', { name: 'Cancel' });
    this.failed = this.dialog.getByRole('alert').filter({ hasText: 'We couldn’t save your profile' });
  }

  /** Fails the next save with a server error. */
  async failNextSave(): Promise<void> {
    await this.page.route(
      '**/api/profile',
      (route) =>
        route.request().method() === 'PUT' ? route.fulfill({ status: 500, json: {} }) : route.fallback(),
      { times: 1 },
    );
  }

  /** Holds the next save until the test ends, to look at the busy state. */
  async holdSave(): Promise<void> {
    await this.page.route('**/api/profile', (route) =>
      route.request().method() === 'PUT' ? new Promise(() => undefined) : route.fallback(),
    );
  }
}
