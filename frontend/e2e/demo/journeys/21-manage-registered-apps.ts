import { spawnSync } from 'node:child_process';
import { apiEnvironment, SAMPLE_APP_URL } from '../../support/api-server';
import type { Journey } from '../scripts/run-journey';
import { REPO } from '../scripts/paths';

/** Manage registered apps: an app's actions, editing it, rotating its secret, disabling it and deleting it. */
const journey: Journey = async ({ page, shot, baseURL }) => {
  // Maya is an administrator (journey 19), with Budget registered as a confidential app.
  spawnSync(
    'dotnet',
    [
      'run',
      '--no-build',
      '--project',
      'backend/src/Ingresso.Cli',
      '--',
      'users',
      'grant-admin',
      '--email',
      'dev@ingresso.dev',
    ],
    { cwd: REPO, env: apiEnvironment('demo'), encoding: 'utf8' },
  );
  const signedIn = await page.request.post(`${baseURL}/api/test/sign-in`, {
    data: { email: 'dev@ingresso.dev' },
  });
  if (!signedIn.ok()) throw new Error(`Demo sign-in failed: ${signedIn.status()}`);
  await page.goto(`${baseURL}/settings`);
  const xsrf = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN')?.value ?? '';
  const budget = await page.request.post(`${baseURL}/api/clients`, {
    headers: { 'X-XSRF-TOKEN': xsrf },
    data: {
      name: 'Budget',
      redirectUris: ['https://budget.example.com/signin-oidc'],
      postLogoutRedirectUris: [],
      frontChannelLogoutUri: null,
      scopes: [],
      confidential: true,
      offlineAccess: false,
    },
  });
  if (!budget.ok()) throw new Error(`Registering Budget failed: ${budget.status()}`);

  // 1. Each app has its actions.
  await page.reload();
  const apps = page.getByRole('list', { name: 'Registered apps' });
  await apps.getByRole('listitem').filter({ hasText: 'Budget' }).waitFor();
  await apps.getByRole('button', { name: 'Actions for Budget' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).waitFor();
  await shot('an-apps-actions');

  // 2. Edit Budget: add a second redirect address and let it stay signed in.
  await page.getByRole('menuitem', { name: 'Edit' }).click();
  const edit = page.getByRole('dialog', { name: 'Edit Budget' });
  await edit
    .getByLabel('Redirect addresses')
    .fill('https://budget.example.com/signin-oidc\nhttps://budget.example.com/oidc-callback');
  await edit.getByRole('checkbox', { name: 'Let it stay signed in with refresh tokens' }).check();
  await shot('edit-an-app');
  await edit.getByRole('button', { name: 'Save changes' }).click();
  await page.locator('ig-toast').filter({ hasText: 'App saved' }).waitFor();
  await edit.waitFor({ state: 'hidden' });

  // 3. Rotate Budget's secret; the new one is shown once.
  await apps.getByRole('button', { name: 'Actions for Budget' }).click();
  await page.getByRole('menuitem', { name: 'Rotate secret' }).click();
  const rotate = page.getByRole('dialog', { name: 'Rotate Budget’s secret?' });
  await rotate.waitFor();
  await shot('rotate-the-secret');
  await rotate.getByRole('button', { name: 'Rotate secret' }).click();
  const secret = page.getByRole('dialog', { name: 'Budget has a new secret' });
  await secret.waitFor();
  await shot('the-new-secret-shown-once');
  await secret.getByRole('button', { name: 'Done' }).click();
  await page.locator('ig-toast').filter({ hasText: 'Secret rotated' }).waitFor();

  // 4. Disable the sample app; its sign-in is refused.
  // Toasts close themselves after 8 seconds but pause while pointed at or focused, so move both away first.
  const dismissToasts = async () => {
    await page.mouse.move(40, 360);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.waitForFunction(() => !document.querySelector('ig-toast'), undefined, { timeout: 30_000 });
  };
  await dismissToasts();
  await apps.getByRole('button', { name: 'Actions for Sample app' }).click();
  await page.getByRole('menuitem', { name: 'Disable' }).click();
  await page.locator('ig-toast').filter({ hasText: 'App disabled' }).waitFor();
  await apps.getByRole('listitem').filter({ hasText: 'Sample app' }).getByText('Disabled').waitFor();
  await dismissToasts();
  await shot('disable-an-app');
  await page.goto(SAMPLE_APP_URL);
  await page.getByRole('link', { name: 'Sign in with ingresso' }).click();
  await page.waitForURL(/\/authorize-error$/);
  await page.getByRole('heading', { level: 1 }).waitFor();
  await shot('its-sign-in-refused');

  // 5. Delete Budget after typing its name.
  await page.goto(`${baseURL}/settings`);
  await apps.getByRole('button', { name: 'Actions for Budget' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  const remove = page.getByRole('dialog', { name: 'Delete Budget?' });
  await remove.getByLabel('Type Budget to confirm').fill('Budget');
  await shot('delete-after-typing-its-name');
  await remove.getByRole('button', { name: 'Delete app' }).click();
  await page.locator('ig-toast').filter({ hasText: 'App deleted' }).waitFor();
};

export default journey;
