import { Locator, Page } from '@playwright/test';

/** "Delete <name>?": deletes a registered app once its name is typed to confirm (L2-115). */
export class DeleteClientDialog {
  readonly dialog: Locator;
  readonly confirmName: Locator;
  readonly delete: Locator;
  readonly cancel: Locator;
  readonly failed: Locator;

  constructor(
    private readonly page: Page,
    name: string,
  ) {
    this.dialog = page.getByRole('dialog', { name: `Delete ${name}?` });
    this.confirmName = this.dialog.getByLabel(`Type ${name} to confirm`);
    this.delete = this.dialog.getByRole('button', { name: /^(Delete app|Deleting…)$/ });
    this.cancel = this.dialog.getByRole('button', { name: 'Cancel' });
    this.failed = this.dialog.getByRole('alert').filter({ hasText: 'We couldn’t delete the app' });
  }

  /** Fails the next deletion with a server error. */
  async failNextDeletion(): Promise<void> {
    await this.page.route(
      '**/api/clients/*',
      (route) =>
        route.request().method() === 'DELETE' ? route.fulfill({ status: 500, json: {} }) : route.fallback(),
      { times: 1 },
    );
  }

  /** Holds the next deletion until the test ends, to look at the busy state. */
  async holdDeletion(): Promise<void> {
    await this.page.route('**/api/clients/*', (route) =>
      route.request().method() === 'DELETE' ? new Promise(() => undefined) : route.fallback(),
    );
  }
}
