import type { Journey } from '../scripts/run-journey';

/** The ingresso app shell: light and dark themes, the phone layout, the not-found page and a toast. */
const journey: Journey = async ({ page, shot }) => {
  // Sign in through the test seam; the cookie is shared by the page's browser context.
  const response = await page.request.post('/api/test/sign-in', { data: { email: 'dev@ingresso.dev' } });
  if (!response.ok()) throw new Error(`Test sign-in failed: ${response.status()}`);

  await page.goto('/');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.getByText('Gmail', { exact: true }).waitFor();
  await shot('dashboard-light');

  await page.emulateMedia({ colorScheme: 'dark' });
  await shot('dashboard-dark');
  await page.emulateMedia({ colorScheme: 'light' });

  await page.setViewportSize({ width: 390, height: 720 });
  await page.waitForTimeout(400);
  await shot('phone-header', { phone: true });
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.goto('/no-such-page');
  await page.getByRole('heading', { name: 'That door doesn’t open anywhere' }).waitFor();
  await shot('not-found');

  await page.goto('/');
  await page.getByText('Gmail', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Add app' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add an app' });
  await dialog.getByLabel('Name', { exact: true }).fill('Roadmap');
  await dialog.getByLabel('Address', { exact: true }).fill('roadmap.example.com');
  await dialog.getByRole('button', { name: 'Add app' }).click();
  await page.locator('ig-toast').filter({ hasText: 'App added' }).waitFor();
  await shot('app-added-toast');
};

export default journey;
