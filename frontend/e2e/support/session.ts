import { Page } from '@playwright/test';

/** The seeded person the suite signs in as (Maya Okafor, SeedData.UserEmail). */
export const MAYA = 'dev@ingresso.dev';

/** Signs the page's browser context in as a seeded user through the test-only seam. */
export async function signInAs(page: Page, email: string = MAYA): Promise<void> {
  if (process.env['E2E_FAKE_API']) return;
  const response = await page.request.post('/api/test/sign-in', { data: { email } });
  if (!response.ok()) throw new Error(`Test sign-in failed for ${email}: ${response.status()}`);
}

/** The administrator the suite signs in as; a separate account, so Maya's role never changes (L2-103). */
export const ADMIN = 'admin@ingresso.dev';

/** Signs the page's browser context in as an administrator through the test-only seam. */
export async function signInAsAdministrator(page: Page, email: string = ADMIN): Promise<void> {
  const response = await page.request.post('/api/test/sign-in', { data: { email, administrator: true } });
  if (!response.ok()) throw new Error(`Test sign-in failed for ${email}: ${response.status()}`);
}

/** Signs the context in as a brand-new account whose email is not yet verified (L2-029). Returns its address. */
export async function signInAsUnverified(page: Page): Promise<string> {
  const email = `newcomer-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  const response = await page.request.post('/api/test/sign-in', { data: { email, createUnverified: true } });
  if (!response.ok()) throw new Error(`Test sign-in failed for ${email}: ${response.status()}`);
  return email;
}
