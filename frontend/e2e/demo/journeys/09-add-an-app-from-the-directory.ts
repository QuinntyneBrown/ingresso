import type { Journey } from '../scripts/run-journey';

/** Add an app from the directory: browse, spot what is already added, search, pre-filled form, new tile. */
const journey: Journey = async ({ page, shot }) => {
  const response = await page.request.post('/api/test/sign-in', { data: { email: 'dev@ingresso.dev' } });
  if (!response.ok()) throw new Error(`Test sign-in failed: ${response.status()}`);

  await page.goto('/');
  await page.getByText('Datadog', { exact: true }).waitFor();
  await page.getByRole('banner').getByRole('button', { name: 'Add app' }).click();
  await page.getByRole('dialog', { name: 'Add an app' }).waitFor();
  await shot('browse-directory-in-add-dialog');

  await page.getByRole('button', { name: 'Browse directory' }).click();
  await page.getByRole('heading', { level: 1, name: 'Add an app' }).waitFor();
  await page.getByText('Sentry', { exact: true }).first().waitFor();
  await shot('directory-with-added-badges');

  await page.getByRole('searchbox', { name: 'Search the directory' }).fill('sent');
  await page.waitForTimeout(300);
  await shot('search-narrows-the-list');

  await page.getByRole('button', { name: /^Add Sentry/ }).click();
  await page.getByRole('dialog', { name: 'Add an app' }).waitFor();
  await shot('form-pre-filled');

  await page.getByRole('dialog').getByRole('button', { name: 'Add app' }).click();
  await page.getByText('App added').first().waitFor();
  await page.goto('/');
  const added = page.getByText('Sentry', { exact: true }).first();
  await added.waitFor();
  await added.scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 120);
  await shot('new-tile-on-the-dashboard');
};

export default journey;
