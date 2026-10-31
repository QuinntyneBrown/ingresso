import { Locator, Page } from '@playwright/test';

/** The header, footer and toasts that frame every screen. */
export class AppShell {
  readonly brand: Locator;
  readonly brandMark: Locator;
  readonly search: Locator;
  readonly searchHint: Locator;
  readonly editLayout: Locator;
  readonly done: Locator;
  readonly editLayoutUnavailable: Locator;
  readonly addApp: Locator;
  readonly avatar: Locator;
  readonly footerNote: Locator;
  readonly brandGuide: Locator;

  constructor(private readonly page: Page) {
    const header = page.getByRole('banner');
    this.brand = header.getByRole('link', { name: 'ingresso home' });
    this.brandMark = this.brand.locator('svg');
    this.search = page.getByRole('searchbox', { name: 'Jump to an app' });
    this.searchHint = page.locator('ig-search kbd');
    this.editLayout = header.getByRole('button', { name: 'Edit layout' });
    this.done = header.getByRole('button', { name: 'Done' });
    this.editLayoutUnavailable = page.locator('#edit-layout-unavailable');
    this.addApp = header.getByRole('button', { name: 'Add app' });
    this.avatar = header.locator('ig-avatar');
    const footer = page.getByRole('contentinfo');
    this.footerNote = footer.getByText('Apps open in a new tab.');
    this.brandGuide = footer.getByRole('link', { name: 'Brand guide' });
  }

  /** The toast with this title. */
  toast(title: string): Locator {
    return this.page.locator('ig-toast').filter({ hasText: title });
  }

  async pressSlash(): Promise<void> {
    await this.page.keyboard.press('/');
  }

  async typeInSearch(text: string): Promise<void> {
    await this.search.fill(text);
  }
}
