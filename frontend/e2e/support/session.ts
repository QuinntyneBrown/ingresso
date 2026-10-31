import { Page } from '@playwright/test';

/** The seeded person the suite signs in as (Maya Okafor, SeedData.UserEmail). */
export const MAYA = 'dev@ingresso.dev';

/** Signs the page's browser context in as a seeded user through the test-only seam. */
export async function signInAs(page: Page, email: string = MAYA): Promise<void> {
  if (process.env['E2E_FAKE_API']) return;
  const response = await page.request.post('/api/test/sign-in', { data: { email } });
  if (!response.ok()) throw new Error(`Test sign-in failed for ${email}: ${response.status()}`);
}
