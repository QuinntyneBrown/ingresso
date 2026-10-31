import type { Journey } from '../scripts/run-journey';

/** Add an app by address: open Add app, leave the address out, fix it, save, and see the new tile and toast. */
const journey: Journey = async ({ page, shot }) => {
  const response = await page.request.post('/api/test/sign-in', { data: { email: 'dev@ingresso.dev' } });
  if (!response.ok()) throw new Error(`Test sign-in failed: ${response.status()}`);

  await page.goto('/');
  await page.getByText('Gmail', { exact: true }).waitFor();
  await shot('dashboard-before');

  await page.getByRole('button', { name: 'Add app' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add an app' });
  await dialog.waitFor();
  await shot('add-app-dialog');

  await dialog.getByLabel('Name', { exact: true }).fill('Asana');
  await dialog.getByRole('button', { name: 'Add app' }).click();
  await dialog.getByText('Enter a web address for the app.').waitFor();
  await shot('address-missing');

  await dialog.getByLabel('Address', { exact: true }).fill('https://app.asana.com');
  await dialog.getByLabel('Teal', { exact: true }).check();
  await shot('address-fixed');
  await dialog.getByRole('button', { name: 'Add app' }).click();

  await page.getByText('Asana is on your dashboard.').waitFor();
  await page.getByText('app.asana.com').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await shot('new-tile-and-toast');
};

export default journey;
