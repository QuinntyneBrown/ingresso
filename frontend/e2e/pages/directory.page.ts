import { Locator, Page } from '@playwright/test';
import { signInAs } from '../support/session';

/** The directory: common apps to add, or a custom URL. */
export class DirectoryPage {
  readonly heading: Locator;
  readonly customUrl: Locator;
  readonly search: Locator;
  readonly noMatches: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Add an app' });
    this.customUrl = page.getByRole('button', { name: 'Add a custom URL' });
    this.search = page.getByRole('searchbox', { name: 'Search the directory' });
    this.noMatches = page.getByRole('heading', { name: /No apps match/ });
  }

  async open(): Promise<void> {
    await signInAs(this.page);
    await this.page.goto('/directory');
  }

  /** The headings that group apps by category, in order. */
  categories(): Promise<string[]> {
    return this.page.locator('.dir-section h3').allInnerTexts();
  }

  /** The names of the apps listed, in order. */
  names(): Promise<string[]> {
    return this.page.locator('.catalog__name').allInnerTexts();
  }

  /** The category heading an app is listed under. */
  categoryOf(name: string): Promise<string> {
    return this.entry(name)
      .locator('xpath=ancestor::section[contains(@class,"dir-section")][1]//h3')
      .innerText();
  }

  added(name: string): Locator {
    return this.entry(name).getByText('Added', { exact: true });
  }

  addButton(name: string): Locator {
    return this.entry(name).getByRole('button', { name: new RegExp(`^Add ${name}`) });
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
