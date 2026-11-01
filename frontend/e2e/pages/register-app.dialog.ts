import { Locator, Page } from '@playwright/test';

export interface AppEntries {
  name: string;
  redirectUris?: string[];
  postLogoutRedirectUris?: string[];
  frontChannelLogoutUri?: string;
  scopes?: string[];
  confidential?: boolean;
}

/**
 * "Register an app": registers an app that signs in with ingresso, from Settings → Apps (L2-105). In edit mode it is
 * titled "Edit <name>" and saves the app's changes (L2-112).
 */
export class RegisterAppDialog {
  readonly dialog: Locator;
  readonly name: Locator;
  readonly redirectUris: Locator;
  readonly postLogoutRedirectUris: Locator;
  readonly frontChannelLogoutUri: Locator;
  readonly public: Locator;
  readonly confidential: Locator;
  readonly register: Locator;
  readonly registering: Locator;
  readonly cancel: Locator;
  readonly summary: Locator;
  readonly failed: Locator;
  /** Lets the app ask for refresh tokens (L2-107, L2-112). */
  readonly staySignedIn: Locator;
  readonly save: Locator;
  readonly saving: Locator;
  /** In edit mode, the type is text that can't be changed. */
  readonly fixedType: Locator;

  constructor(
    private readonly page: Page,
    title = 'Register an app',
  ) {
    this.dialog = page.getByRole('dialog', { name: title });
    this.name = this.dialog.getByLabel('Name', { exact: true });
    this.redirectUris = this.dialog.getByLabel('Redirect addresses');
    this.postLogoutRedirectUris = this.dialog.getByLabel('Sign-out return addresses');
    this.frontChannelLogoutUri = this.dialog.getByLabel('Front-channel sign-out address');
    this.public = this.dialog.getByRole('radio', { name: /^Public/ });
    this.confidential = this.dialog.getByRole('radio', { name: /^Confidential/ });
    this.register = this.dialog.getByRole('button', { name: 'Register app' });
    this.registering = this.dialog.getByRole('button', { name: 'Registering…' });
    this.cancel = this.dialog.getByRole('button', { name: 'Cancel' });
    this.summary = this.dialog.getByRole('alert').filter({ hasText: /^Fix/ });
    this.failed = this.dialog.getByRole('alert').filter({ hasText: /We couldn’t (register|save) the app/ });
    this.staySignedIn = this.dialog.getByRole('checkbox', {
      name: 'Let it stay signed in with refresh tokens',
    });
    this.save = this.dialog.getByRole('button', { name: 'Save changes' });
    this.saving = this.dialog.getByRole('button', { name: 'Saving…' });
    this.fixedType = this.dialog.getByText(/An app’s type can’t change after it’s registered\./);
  }

  /** The checkbox allowing an API scope, by its label such as "Sample API · sample-api.read". */
  scope(label: string): Locator {
    return this.dialog.getByRole('checkbox', { name: label });
  }

  async fill(entries: AppEntries): Promise<void> {
    await this.name.fill(entries.name);
    await this.redirectUris.fill((entries.redirectUris ?? []).join('\n'));
    await this.postLogoutRedirectUris.fill((entries.postLogoutRedirectUris ?? []).join('\n'));
    await this.frontChannelLogoutUri.fill(entries.frontChannelLogoutUri ?? '');
    for (const scope of entries.scopes ?? []) await this.scope(scope).check();
    await (entries.confidential ? this.confidential : this.public).check();
  }

  /** Offers the mocks' two APIs, so screenshots don't depend on what other tests registered. */
  async showMockApis(): Promise<void> {
    await this.page.route('**/api/resources', (route) =>
      route.fulfill({
        json: [
          { name: 'Notes API', audience: 'notes-api', scopes: ['notes.read'] },
          { name: 'Sample API', audience: 'ingresso-sample-api', scopes: ['sample-api.read'] },
        ],
      }),
    );
  }

  /** Answers the next registration as the mocks' confidential Budget app with a fixed secret. */
  async registerAsMockBudget(): Promise<void> {
    await this.page.route(
      '**/api/clients',
      (route) =>
        route.request().method() === 'POST'
          ? route.fulfill({
              status: 201,
              json: {
                client: {
                  clientId: '7c1e9a40d2b84f3a',
                  name: 'Budget',
                  redirectUris: ['https://budget.example.com/signin-oidc'],
                  postLogoutRedirectUris: [],
                  scopes: [],
                  frontChannelLogoutUri: null,
                  confidential: true,
                },
                clientSecret: 'Jd8xQ2mV7rT1kZp4Wn6Yb0Lc3Hs9Gf5Ea_Ru-Ko2Ni',
              },
            })
          : route.fallback(),
      { times: 1 },
    );
  }

  /** Fails the next registration with a server error. */
  async failNextRegistration(): Promise<void> {
    await this.page.route(
      '**/api/clients',
      (route) =>
        route.request().method() === 'POST'
          ? route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{}' })
          : route.fallback(),
      { times: 1 },
    );
  }

  /** Keeps the next registration waiting, so the dialog stays busy. */
  async holdRegistration(): Promise<void> {
    await this.page.route('**/api/clients', (route) =>
      route.request().method() === 'POST' ? new Promise(() => undefined) : route.fallback(),
    );
  }
}
