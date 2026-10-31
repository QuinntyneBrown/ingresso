import { Locator, Page } from '@playwright/test';

/** The "Edit app" dialog, with its delete confirmation. */
export class EditAppDialog {
  readonly dialog: Locator;
  readonly name: Locator;
  readonly address: Locator;
  readonly description: Locator;
  readonly category: Locator;
  readonly nameError: Locator;
  readonly addressError: Locator;
  readonly save: Locator;
  readonly cancel: Locator;
  readonly delete: Locator;
  readonly confirmDelete: Locator;
  readonly keep: Locator;
  readonly confirmation: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Edit app' });
    this.name = this.dialog.getByLabel('Name', { exact: true });
    this.address = this.dialog.getByLabel('Address', { exact: true });
    this.description = this.dialog.getByLabel(/^Description/);
    this.category = this.dialog.getByLabel(/^Category/);
    this.nameError = this.dialog.locator('#app-name-error');
    this.addressError = this.dialog.locator('#app-url-error');
    this.save = this.dialog.getByRole('button', { name: 'Save changes' });
    this.cancel = this.dialog.getByRole('button', { name: 'Cancel' });
    this.delete = this.dialog.getByRole('button', { name: 'Delete', exact: true });
    this.confirmDelete = this.dialog.getByRole('button', { name: 'Delete app' });
    this.keep = this.dialog.getByRole('button', { name: 'Keep app' });
    this.confirmation = this.dialog.getByRole('alert');
  }

  /** The colour radio with this label, such as Teal. */
  colour(label: string): Locator {
    return this.dialog.getByLabel(label, { exact: true });
  }

  async rename(name: string): Promise<void> {
    await this.name.fill(name);
    await this.save.click();
  }

  async deleteApp(): Promise<void> {
    await this.delete.click();
    await this.confirmDelete.click();
  }
}
