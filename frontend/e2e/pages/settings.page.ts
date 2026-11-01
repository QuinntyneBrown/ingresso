import { Locator, Page } from '@playwright/test';

export type ThemeChoice = 'Match my system' | 'Light' | 'Dark';

/** Settings: the appearance choice, and for administrators the Apps card (L2-104). */
export class SettingsPage {
  readonly heading: Locator;
  readonly appearance: Locator;
  readonly backToApps: Locator;
  readonly apps: Locator;
  readonly appRows: Locator;
  readonly registerApp: Locator;
  readonly noApps: Locator;
  readonly appsLoading: Locator;
  readonly appsFailed: Locator;
  readonly tryAgain: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Settings' });
    this.appearance = page.getByRole('group', { name: 'Appearance' });
    this.backToApps = page.getByRole('link', { name: 'Back to your apps' });
    this.apps = page.getByRole('region', { name: 'Apps' });
    this.appRows = this.apps.getByRole('list', { name: 'Registered apps' }).getByRole('listitem');
    this.registerApp = this.apps.getByRole('button', { name: 'Register an app' }).first();
    this.noApps = this.apps.getByRole('heading', { name: 'No apps yet' });
    this.appsLoading = this.apps.locator('[aria-busy="true"]');
    this.appsFailed = this.apps.getByRole('alert');
    this.tryAgain = this.apps.getByRole('button', { name: 'Try again' });
  }

  /** The row for a registered app, by its name. */
  app(name: string): Locator {
    return this.appRows.filter({ hasText: name });
  }

  /** The button that opens an app's actions menu (journey 21). */
  actionsFor(name: string): Locator {
    return this.apps.getByRole('button', { name: `Actions for ${name}`, exact: true });
  }

  /** An item in the open actions menu, such as Edit, Rotate secret, Disable, Enable or Delete. */
  action(label: string): Locator {
    return this.page.getByRole('menuitem', { name: label, exact: true });
  }

  /** Opens an app's actions and chooses one. */
  async chooseAction(name: string, label: string): Promise<void> {
    await this.actionsFor(name).click();
    await this.action(label).click();
  }

  /** The Disabled badge on an app's row (L2-114). */
  disabledBadge(name: string): Locator {
    return this.app(name).getByText('Disabled', { exact: true });
  }

  /** Answers the apps list with the mocks' three apps, so screenshots don't depend on what other tests registered. */
  async showMockApps(): Promise<void> {
    const app = (clientId: string, name: string, confidential: boolean) => ({
      clientId,
      name,
      redirectUris: [],
      postLogoutRedirectUris: [],
      scopes: [],
      frontChannelLogoutUri: null,
      confidential,
    });
    await this.page.route('**/api/clients', (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({
            json: [
              app('7c1e9a40d2b84f3a', 'Budget', true),
              app('3f9c2b17e6a54d08', 'Notes', false),
              app('ingresso-sample-app', 'Sample app', false),
            ],
          })
        : route.fallback(),
    );
  }

  /** Answers the apps list with none, as on a fresh install. */
  async showNoApps(): Promise<void> {
    await this.page.route('**/api/clients', (route) =>
      route.request().method() === 'GET' ? route.fulfill({ json: [] }) : route.fallback(),
    );
  }

  /** Keeps the apps list loading. */
  async holdApps(): Promise<void> {
    await this.page.route('**/api/clients', (route) =>
      route.request().method() === 'GET' ? new Promise(() => undefined) : route.fallback(),
    );
  }

  /** Fails the next load of the apps list. */
  async failAppsOnce(): Promise<void> {
    await this.page.route(
      '**/api/clients',
      (route) =>
        route.request().method() === 'GET'
          ? route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{}' })
          : route.fallback(),
      { times: 1 },
    );
  }

  async open(): Promise<void> {
    await this.page.goto('/settings');
  }

  choice(name: ThemeChoice): Locator {
    return this.appearance.getByRole('radio', { name });
  }

  async choose(name: ThemeChoice): Promise<void> {
    await this.choice(name).check();
  }

  /** The theme the page is actually showing, read from its colours rather than from any attribute. */
  async shownTheme(): Promise<'light' | 'dark'> {
    return this.page.evaluate(() => {
      const [r, g, b] = getComputedStyle(document.body)
        .backgroundColor.match(/[\d.]+/g)!
        .map(Number);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128 ? 'dark' : 'light';
    });
  }

  /** The lowest text contrast ratio among the visible text on the screen, and which text it is. */
  async lowestTextContrast(): Promise<{ ratio: number; text: string }> {
    return this.page.evaluate(async () => {
      await Promise.all(
        document.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
      );
      const canvas = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
      const rgba = (css: string): [number, number, number, number] => {
        canvas.clearRect(0, 0, 1, 1);
        canvas.fillStyle = '#000';
        canvas.fillStyle = css;
        canvas.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = canvas.getImageData(0, 0, 1, 1).data;
        return [r, g, b, a / 255];
      };
      const over = (top: number[], below: number[]) =>
        [0, 1, 2].map((i) => top[i] * top[3] + below[i] * (1 - top[3]));
      const backdrop = (el: Element): number[] => {
        const layers: number[][] = [];
        for (let node: Element | null = el; node; node = node.parentElement) {
          const c = rgba(getComputedStyle(node).backgroundColor);
          if (c[3] > 0) layers.push(c);
          if (c[3] === 1) break;
        }
        return layers
          .reverse()
          .reduce<number[]>((below, top) => [...over(top, below), 1], [255, 255, 255, 1]);
      };
      const lum = ([r, g, b]: number[]) => {
        const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      let lowest = { ratio: Infinity, text: '' };
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const text = n.textContent?.trim();
        const el = n.parentElement;
        if (!text || !el || el.closest('.visually-hidden, script, style')) continue;
        const box = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (!box.width || !box.height || style.visibility === 'hidden' || style.opacity === '0') continue;
        const bg = backdrop(el);
        const fg = rgba(style.color);
        const color = over(fg, bg);
        const [a, b] = [lum(color), lum(bg)];
        const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        if (ratio < lowest.ratio) lowest = { ratio, text };
      }
      return lowest;
    });
  }
}
