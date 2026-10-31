import type { Journey } from '../scripts/run-journey';

/** Edit a tile: edit layout mode, choose Edit, change the name and colour, save, and see the toast. */
const journey: Journey = async ({ page, shot }) => {
  const response = await page.request.post('/api/test/sign-in', { data: { email: 'dev@ingresso.dev' } });
  if (!response.ok()) throw new Error(`Test sign-in failed: ${response.status()}`);

  await page.goto('/');
  await page.getByText('Slack', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Edit layout' }).click();
  await page.getByRole('button', { name: 'Edit Slack' }).waitFor();
  await shot('edit-layout-mode');

  await page.getByRole('button', { name: 'Edit Slack' }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit app' });
  await dialog.waitFor();
  await shot('edit-dialog');

  await dialog.getByLabel('Name', { exact: true }).fill('Slack (team)');
  await dialog.getByLabel('Teal', { exact: true }).check();
  await shot('changes-made');
  await dialog.getByRole('button', { name: 'Save changes' }).click();

  await page.getByText('Slack (team) was updated.').waitFor();
  await page.getByRole('button', { name: 'Done' }).first().click();
  await shot('saved-with-toast');
};

export default journey;
