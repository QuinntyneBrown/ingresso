import { Locator, Page } from '@playwright/test';

/** The sample app's authorize request as ingresso hands it to the consent page. */
const CONSENT_QUERY = new URLSearchParams({
  client_id: 'ingresso-sample-app',
  redirect_uri: 'http://localhost:5299/signin-oidc',
  response_type: 'code',
  scope: 'openid profile email sample-api.read offline_access',
  state: 'mock',
}).toString();

/** "Approve an app": what an app asks to see, with Allow and Deny (L2-121 to L2-125). */
export class ConsentPage {
  readonly heading: Locator;
  readonly lead: Locator;
  /** The plain-language title of each scope asked for, in order. */
  readonly scopeTitles: Locator;
  /** "You already let it see …", on the new-scopes page. */
  readonly approvedBefore: Locator;
  readonly allow: Locator;
  readonly deny: Locator;
  readonly failed: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.lead = page.getByText('Signed in as ');
    this.scopeTitles = page.getByRole('list', { name: /^What .+ asks for$/ }).locator('.list__title');
    this.approvedBefore = page.getByText('You already let it ');
    this.allow = page.getByRole('button', { name: /^Allow/ });
    this.deny = page.getByRole('button', { name: 'Deny' });
    this.failed = page.getByRole('alert').filter({ hasText: 'We couldn’t save your choice' });
  }

  async waitUntilShown(): Promise<void> {
    await this.page.waitForURL(/\/consent\?/);
    await this.allow.waitFor();
  }

  /**
   * Opens the page for the sample app's request with the mocks' answer, so screenshots don't depend on the database:
   * Maya at maya@northwind.com, and either every scope or only the new ones after approving profile and email.
   */
  async openMock(options: { newScopes?: boolean } = {}): Promise<void> {
    const titles: Record<string, string> = {
      profile: 'See your display name',
      email: 'See your email address',
      'sample-api.read': 'Use Sample API for you',
      offline_access: 'Stay signed in when you’re not using it',
    };
    const scopes = (names: string[]) => names.map((scope) => ({ scope, title: titles[scope] }));
    await this.page.route('**/api/consent?*', (route) =>
      route.request().method() !== 'GET'
        ? route.fallback()
        : route.fulfill({
            json: {
              appName: 'Sample app',
              email: 'maya@northwind.com',
              ask: scopes(options.newScopes ? ['sample-api.read', 'offline_access'] : Object.keys(titles)),
              approved: scopes(options.newScopes ? ['profile', 'email'] : []),
            },
          }),
    );
    await this.page.goto(`/consent?${CONSENT_QUERY}`);
    await this.allow.waitFor();
  }

  /** Opens the page while what the app asks for never arrives, to show the loading state. */
  async openLoading(): Promise<void> {
    await this.page.route('**/api/consent?*', () => undefined);
    await this.page.goto(`/consent?${CONSENT_QUERY}`);
  }

  /** Keeps the next Allow waiting, to show the busy state. */
  async holdAllow(): Promise<void> {
    await this.page.route('**/api/consent', (route) =>
      route.request().method() === 'POST' ? undefined : route.fallback(),
    );
  }

  /** Fails the next Allow with a server error. */
  async failNextAllow(): Promise<void> {
    let pending = true;
    await this.page.route('**/api/consent', (route) => {
      if (!pending || route.request().method() !== 'POST') return route.fallback();
      pending = false;
      return route.fulfill({ status: 500, json: {} });
    });
  }
}
