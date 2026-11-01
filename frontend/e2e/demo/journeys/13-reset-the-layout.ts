import type { Journey } from '../scripts/run-journey';

/** Reset the layout: a rearranged dashboard, the confirmation, and the packed layout. */
const journey: Journey = async ({ page, shot }) => {
  const response = await page.request.post('/api/test/sign-in', { data: { email: 'dev@ingresso.dev' } });
  if (!response.ok()) throw new Error(`Test sign-in failed: ${response.status()}`);

  await page.goto('/');
  await page.getByText('Datadog', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Edit layout' }).click();
  const datadog = page.getByRole('listitem', { name: 'Datadog', exact: true });
  await datadog.focus();
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
  await datadog.scrollIntoViewIfNeeded();
  await shot('rearranged-in-edit-layout');

  await page.getByRole('button', { name: 'Reset layout' }).click();
  await page.getByRole('dialog', { name: 'Reset the layout?' }).waitFor();
  await shot('confirm-reset');

  await page.getByRole('dialog').getByRole('button', { name: 'Reset layout' }).click();
  await page.getByText('Layout reset', { exact: true }).waitFor();
  await shot('layout-reset');
};

export default journey;
