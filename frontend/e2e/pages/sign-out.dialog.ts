import { Locator, Page } from '@playwright/test';

/** The "Sign out of ingresso?" confirmation. */
export class SignOutDialog {
  readonly dialog: Locator;
  readonly signedInAs: Locator;
  readonly signOut: Locator;
  readonly signingOut: Locator;
  readonly stay: Locator;
  readonly failed: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Sign out of ingresso?' });
    this.signedInAs = this.dialog.getByText(/^Signed in as/);
    this.signOut = this.dialog.getByRole('button', { name: 'Sign out' });
    this.signingOut = this.dialog.getByRole('button', { name: 'Signing out…' });
    this.stay = this.dialog.getByRole('button', { name: 'Stay signed in' });
    this.failed = this.dialog.getByRole('alert');
  }
}
