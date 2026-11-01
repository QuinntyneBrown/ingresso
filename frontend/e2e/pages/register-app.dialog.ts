import { Locator, Page } from '@playwright/test';

export interface AppEntries {
  name: string;
  redirectUris?: string[];
  postLogoutRedirectUris?: string[];
  frontChannelLogoutUri?: string;
  scopes?: string[];
  confidential?: boolean;
}

/** "Register an app": registers an app that signs in with ingresso, from Settings → Apps (L2-105). */
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

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Register an app' });
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
    this.failed = this.dialog.getByRole('alert').filter({ hasText: 'We couldn’t register the app' });
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
