import { Locator, Page } from '@playwright/test';
import { TODAY } from '../fixtures';

export type ThemeChoice = 'Match my system' | 'Light' | 'Dark';

/** Settings: the appearance choice, and for administrators the Apps card (L2-104). */
export class SettingsPage {
  readonly heading: Locator;
  readonly appearance: Locator;
  /** The Profile card (L2-117). */
  readonly profile: Locator;
  readonly editProfile: Locator;
  readonly profileLoading: Locator;
  readonly profileFailed: Locator;
  readonly profileTryAgain: Locator;
  readonly backToApps: Locator;
  /** Connected apps: the apps the person approved (journey 24). */
  readonly connectedApps: Locator;
  readonly connectedRows: Locator;
  readonly noConnectedApps: Locator;
  readonly connectedLoading: Locator;
  readonly connectedFailed: Locator;
  readonly connectedTryAgain: Locator;
  /** Devices: where the person is signed in (journey 25). */
  readonly devices: Locator;
  readonly deviceRows: Locator;
  readonly thisDevice: Locator;
  readonly onlyThisDevice: Locator;
  readonly signOutOtherDevices: Locator;
  readonly devicesLoading: Locator;
  readonly devicesFailed: Locator;
  readonly devicesTryAgain: Locator;
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
    this.profile = page.getByRole('region', { name: 'Profile' });
    this.editProfile = this.profile.getByRole('button', { name: 'Edit profile' });
    this.profileLoading = this.profile.locator('[aria-busy="true"]');
    this.profileFailed = this.profile.getByRole('alert');
    this.profileTryAgain = this.profile.getByRole('button', { name: 'Try again' });
    this.backToApps = page.getByRole('link', { name: 'Back to your apps' });
    this.connectedApps = page.getByRole('region', { name: 'Connected apps', exact: true });
    this.connectedRows = this.connectedApps
      .getByRole('list', { name: 'Connected apps' })
      .getByRole('listitem');
    this.noConnectedApps = this.connectedApps.getByRole('heading', { name: 'No connected apps' });
    this.connectedLoading = this.connectedApps.locator('[aria-busy="true"]');
    this.connectedFailed = this.connectedApps.getByRole('alert');
    this.connectedTryAgain = this.connectedApps.getByRole('button', { name: 'Try again' });
    this.devices = page.getByRole('region', { name: 'Devices', exact: true });
    this.deviceRows = this.devices.getByRole('list', { name: 'Signed-in devices' }).getByRole('listitem');
    this.thisDevice = this.deviceRows.filter({ hasText: 'This device' });
    this.onlyThisDevice = this.devices.getByText('You’re not signed in anywhere else.');
    this.signOutOtherDevices = this.devices.getByRole('button', { name: 'Sign out of all other devices' });
    this.devicesLoading = this.devices.locator('[aria-busy="true"]');
    this.devicesFailed = this.devices.getByRole('alert');
    this.devicesTryAgain = this.devices.getByRole('button', { name: 'Try again' });
    this.apps = page.getByRole('region', { name: 'Apps', exact: true });
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

  /** The value the Profile card shows for a detail, such as "Display name" or "Email". */
  profileValue(label: string): Locator {
    return this.profile
      .getByRole('list', { name: 'Your profile' })
      .getByRole('listitem')
      .filter({ has: this.page.locator('.list__title').getByText(label, { exact: true }) })
      .locator('.list__meta');
  }

  /** Answers the profile with the mocks' person, so screenshots don't depend on the signed-in account. */
  async showMockProfile(displayName: string | null = 'Maya Reyes'): Promise<void> {
    await this.page.route('**/api/profile', (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({ json: { displayName, email: 'maya@northwind.com', emailVerified: true } })
        : route.fallback(),
    );
  }

  /** A connected app's row, by its name. */
  connectedApp(name: string): Locator {
    return this.connectedRows.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  /** The Revoke button on a connected app's row. */
  revokeAccessFor(name: string): Locator {
    return this.connectedApps.getByRole('button', { name: `Revoke ${name}’s access` });
  }

  /** A device's row, by its description, such as "Safari on iPhone". */
  device(name: string): Locator {
    return this.deviceRows.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  /** The End session button on a device's row. */
  endSessionOn(name: string): Locator {
    return this.devices.getByRole('button', { name: `End the session on ${name}` });
  }

  /** Fails the next devices load with a server error. */
  async failDevicesOnce(): Promise<void> {
    let pending = true;
    await this.page.route('**/api/sessions', (route) => {
      if (!pending || route.request().method() !== 'GET') return route.fallback();
      pending = false;
      return route.fulfill({ status: 500, json: {} });
    });
  }

  /** Keeps the devices load waiting, to show the loading state. */
  async holdDevices(): Promise<void> {
    await this.page.route('**/api/sessions', (route) =>
      route.request().method() === 'GET' ? undefined : route.fallback(),
    );
  }

  /** Answers the devices with the mocks' three (or only this one), timed against the suite's fixed clock. */
  async showMockDevices(devices: 'mocks' | 'only' = 'mocks'): Promise<void> {
    const hoursAgo = (hours: number) => new Date(TODAY.getTime() - hours * 3600_000).toISOString();
    const all = [
      {
        id: 'a1',
        device: 'Chrome on macOS',
        signedInAt: '2026-10-28T09:00:00Z',
        lastActiveAt: hoursAgo(0),
        current: true,
      },
      {
        id: 'b2',
        device: 'Safari on iPhone',
        signedInAt: '2026-10-30T09:00:00Z',
        lastActiveAt: hoursAgo(3),
        current: false,
      },
      {
        id: 'c3',
        device: 'Firefox on Windows',
        signedInAt: '2026-10-02T09:00:00Z',
        lastActiveAt: hoursAgo(6 * 24),
        current: false,
      },
    ];
    const json = devices === 'only' ? all.slice(0, 1) : all;
    await this.page.route('**/api/sessions', (route) =>
      route.request().method() === 'GET' ? route.fulfill({ json }) : route.fallback(),
    );
  }

  /** Fails the next connected-apps load with a server error. */
  async failConnectedAppsOnce(): Promise<void> {
    let pending = true;
    await this.page.route('**/api/connected-apps', (route) => {
      if (!pending || route.request().method() !== 'GET') return route.fallback();
      pending = false;
      return route.fulfill({ status: 500, json: {} });
    });
  }

  /** Keeps the connected-apps load waiting, to show the loading state. */
  async holdConnectedApps(): Promise<void> {
    await this.page.route('**/api/connected-apps', (route) =>
      route.request().method() === 'GET' ? undefined : route.fallback(),
    );
  }

  /**
   * Answers the connected apps with the mocks' two apps (or none), so screenshots don't depend on the database or
   * the date: "Last used" is two hours and five days before now.
   */
  async showMockConnectedApps(apps: 'mocks' | 'none' = 'mocks'): Promise<void> {
    const hoursAgo = (hours: number) => new Date(TODAY.getTime() - hours * 3600_000).toISOString();
    const title = (scope: string, text: string) => ({ scope, title: text });
    const json =
      apps === 'none'
        ? []
        : [
            {
              clientId: 'notes',
              name: 'Notes',
              scopes: [
                title('email', 'See your email address'),
                title('notes.read', 'Use Notes API for you'),
              ],
              approvedAt: '2026-09-03T10:00:00Z',
              lastUsedAt: hoursAgo(5 * 24),
            },
            {
              clientId: 'ingresso-sample-app',
              name: 'Sample app',
              scopes: [
                title('profile', 'See your display name'),
                title('email', 'See your email address'),
                title('sample-api.read', 'Use Sample API for you'),
                title('offline_access', 'Stay signed in when you’re not using it'),
              ],
              approvedAt: '2026-10-12T10:00:00Z',
              lastUsedAt: hoursAgo(2),
            },
          ];
    await this.page.route('**/api/connected-apps', (route) =>
      route.request().method() === 'GET' ? route.fulfill({ json }) : route.fallback(),
    );
  }

  /** The Profile card has loaded its values. */
  async profileShown(): Promise<void> {
    await this.profileValue('Email').waitFor();
  }

  /** Fails the next profile load with a server error. */
  async failProfileOnce(): Promise<void> {
    // Counts only the GET: a times-limited route would also count other requests that fall through.
    let pending = true;
    await this.page.route('**/api/profile', (route) => {
      if (!pending || route.request().method() !== 'GET') return route.fallback();
      pending = false;
      return route.fulfill({ status: 500, json: {} });
    });
  }

  /** Holds the profile load until the test ends, to look at the loading state. */
  async holdProfile(): Promise<void> {
    await this.page.route('**/api/profile', (route) =>
      route.request().method() === 'GET' ? new Promise(() => undefined) : route.fallback(),
    );
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
    // Notes is filled in and disabled, as in docs/mocks (settings/apps, register-app/edit).
    const notes = {
      ...app('3f9c2b17e6a54d08', 'Notes', false),
      redirectUris: ['https://notes.example.com/signin-oidc'],
      postLogoutRedirectUris: ['https://notes.example.com/signout-callback-oidc'],
      frontChannelLogoutUri: 'https://notes.example.com/frontchannel-logout',
      scopes: ['notes.read'],
      offlineAccess: true,
      disabled: true,
    };
    await this.page.route('**/api/clients', (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({
            json: [
              app('7c1e9a40d2b84f3a', 'Budget', true),
              notes,
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
