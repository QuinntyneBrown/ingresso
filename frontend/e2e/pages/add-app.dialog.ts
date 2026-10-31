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
  readonly category: Locator;
  readonly submit: Locator;
  readonly cancel: Locator;
  readonly nameError: Locator;
  readonly addressError: Locator;
  readonly duplicateWarning: Locator;
  readonly addAnyway: Locator;
  readonly browseDirectory: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Add an app' });
    this.name = this.dialog.getByLabel('Name', { exact: true });
    this.address = this.dialog.getByLabel('Address', { exact: true });
    this.description = this.dialog.getByLabel(/^Description/);
    this.category = this.dialog.getByLabel(/^Category/);
    this.initials = this.dialog.getByLabel('Initials', { exact: true });
    this.submit = this.dialog.getByRole('button', { name: 'Add app' });
    this.cancel = this.dialog.getByRole('button', { name: 'Cancel' });
    this.nameError = this.dialog.locator('#app-name-error');
    this.addressError = this.dialog.locator('#app-url-error');
    this.duplicateWarning = this.dialog
      .getByRole('alert')
      .filter({ hasText: 'You already added this address' });
    this.addAnyway = this.dialog.getByRole('button', { name: 'Add anyway' });
    this.browseDirectory = this.dialog.getByRole('button', { name: 'Browse directory' });
  }

  async fill(details: AppDetails): Promise<void> {
    await this.name.fill(details.name);
    await this.address.fill(details.url);
    if (details.description) await this.description.fill(details.description);
    if (details.category) await this.dialog.getByLabel(/^Category/).fill(details.category);
    if (details.color) await this.dialog.getByLabel(details.color, { exact: true }).check();
  }

  async add(details: AppDetails): Promise<void> {
    await this.fill(details);
    await this.submit.click();
  }

  /** Scrolls every scrolled part of the dialog back to its top, so a capture does not depend on where the fields were focused. */
  async scrollToTop(): Promise<void> {
    await this.dialog.evaluate((root) => {
      for (const el of [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))]) el.scrollTop = 0;
    });
  }
}
