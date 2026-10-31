import { Locator, Page } from '@playwright/test';

export interface AppDetails {
  name: string;
  url: string;
  description?: string;
  category?: string;
  color?: string;
}

/** The "Add an app" dialog. */
export class AddAppDialog {
  readonly dialog: Locator;
  readonly name: Locator;
  readonly address: Locator;
  readonly description: Locator;
  readonly initials: Locator;
  readonly submit: Locator;
  readonly cancel: Locator;
  readonly nameError: Locator;
  readonly addressError: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Add an app' });
    this.name = this.dialog.getByLabel('Name', { exact: true });
    this.address = this.dialog.getByLabel('Address', { exact: true });
    this.description = this.dialog.getByLabel('Description', { exact: true });
    this.initials = this.dialog.getByLabel('Initials', { exact: true });
    this.submit = this.dialog.getByRole('button', { name: 'Add app' });
    this.cancel = this.dialog.getByRole('button', { name: 'Cancel' });
    this.nameError = this.dialog.locator('#app-name-error');
    this.addressError = this.dialog.locator('#app-url-error');
  }

  async fill(details: AppDetails): Promise<void> {
    await this.name.fill(details.name);
    await this.address.fill(details.url);
    if (details.description) await this.description.fill(details.description);
    if (details.category) await this.dialog.getByLabel('Category', { exact: true }).fill(details.category);
    if (details.color) await this.dialog.getByLabel(details.color, { exact: true }).check();
  }

  async add(details: AppDetails): Promise<void> {
    await this.fill(details);
    await this.submit.click();
  }
}
