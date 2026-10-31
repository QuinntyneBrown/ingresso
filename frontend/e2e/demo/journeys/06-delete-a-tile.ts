import type { Journey } from '../scripts/run-journey';

/** Delete a tile: edit layout, open Edit, choose Delete, read the confirmation, confirm, and see the toast. */
const journey: Journey = async ({ page, shot }) => {
  const response = await page.request.post('/api/test/sign-in', { data: { email: 'dev@ingresso.dev' } });
  if (!response.ok()) throw new Error(`Test sign-in failed: ${response.status()}`);

  await page.goto('/');
  await page.getByText('Datadog', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Edit layout' }).click();
  await page.getByRole('button', { name: 'Edit Datadog' }).waitFor();
  await page.getByRole('button', { name: 'Edit Datadog' }).scrollIntoViewIfNeeded();
  await shot('edit-layout-mode');

  await page.getByRole('button', { name: 'Edit Datadog' }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit app' });
  await dialog.waitFor();
  await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
  await dialog.getByText('Delete Datadog?').waitFor();
  await shot('confirmation-names-the-tile');

  await dialog.getByRole('button', { name: 'Delete app' }).click();
  await page.getByText('Datadog was removed.').waitFor();
  await page.getByRole('button', { name: 'Done' }).first().click();
  await shot('tile-gone-with-toast');
};

export default journey;
