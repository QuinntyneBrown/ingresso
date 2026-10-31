import { Locator, Page } from '@playwright/test';
import { signInAs } from '../support/session';

/** The directory: common apps to add, or a custom URL. */
export class DirectoryPage {
  readonly heading: Locator;
  readonly customUrl: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Add an app' });
    this.customUrl = page.getByRole('button', { name: 'Add a custom URL' });
  }

  async open(): Promise<void> {
    await signInAs(this.page);
    await this.page.goto('/directory');
  }

  entry(name: string): Locator {
    return this.page.locator('.catalog__item').filter({ hasText: name });
  }

  async addFromCatalog(name: string): Promise<void> {
    await this.entry(name)
      .getByRole('button', { name: new RegExp(`^Add ${name}`) })
      .click();
  }
}
