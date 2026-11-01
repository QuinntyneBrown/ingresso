// Acceptance Test
// Traces to: L2-112, L2-113, L2-114, L2-115
// Description: An app's actions and the edit, rotate-secret, delete-client and rotated client-secret dialogs look as designed in docs/mocks (settings: apps-menu; register-app: edit, edit-busy; rotate-secret: default, busy, error; delete-client: default, busy, error; client-secret: rotated).
import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { ClientSecretDialog } from '../pages/client-secret.dialog';
import { DeleteClientDialog } from '../pages/delete-client.dialog';
import { RegisterAppDialog } from '../pages/register-app.dialog';
import { RotateSecretDialog } from '../pages/rotate-secret.dialog';
import { SettingsPage } from '../pages/settings.page';
import { signInAsAdministrator } from '../support/session';

const SECRET = 'Qm9vay1rZWVwaW5nLXNlY3JldC1yb3RhdGVkLW9uY2Ux';

test.describe('Manage registered apps, visually', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  async function openApps(page: Page): Promise<SettingsPage> {
    const settings = new SettingsPage(page);
    await signInAsAdministrator(page);
    await settings.showMockProfile();
    await settings.showMockConnectedApps();
    await settings.showMockDevices();
    await settings.showMockApps();
    await new RegisterAppDialog(page).showMockApis();
    await settings.open();
    await expect(settings.appRows).toHaveCount(3);
    await settings.profileShown();
    return settings;
  }

  test('apps menu', async ({ page }) => {
    const settings = await openApps(page);
    await settings.actionsFor('Budget').click();
    await expect(settings.action('Delete')).toBeVisible();
    await expect(page).toHaveScreenshot('apps-menu.png');
  });

  test('apps menu in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const settings = await openApps(page);
    await settings.actionsFor('Budget').click();
    await expect(settings.action('Delete')).toBeVisible();
    await expect(page).toHaveScreenshot('apps-menu-dark.png');
  });

  async function openEdit(page: Page): Promise<RegisterAppDialog> {
    const settings = await openApps(page);
    await settings.chooseAction('Notes', 'Edit');
    const edit = new RegisterAppDialog(page, 'Edit Notes');
    await expect(edit.scope('Notes API · notes.read')).toBeChecked();
    return edit;
  }

  test('edit', async ({ page }) => {
    const edit = await openEdit(page);
    await expect(edit.dialog).toHaveScreenshot('edit.png');
  });

  test('edit busy', async ({ page }) => {
    const edit = await openEdit(page);
    await page.route('**/api/clients/*', (route) =>
      route.request().method() === 'PUT' ? new Promise(() => undefined) : route.fallback(),
    );
    await edit.save.click();
    await expect(edit.saving).toBeVisible();
    await expect(edit.dialog).toHaveScreenshot('edit-busy.png');
  });

  async function openRotate(page: Page): Promise<RotateSecretDialog> {
    const settings = await openApps(page);
    await settings.chooseAction('Budget', 'Rotate secret');
    const rotate = new RotateSecretDialog(page);
    await expect(rotate.dialog).toBeVisible();
    return rotate;
  }

  test('rotate secret', async ({ page }) => {
    const rotate = await openRotate(page);
    await expect(rotate.dialog).toHaveScreenshot('rotate-secret.png');
  });

  test('rotate secret in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const rotate = await openRotate(page);
    await expect(rotate.dialog).toHaveScreenshot('rotate-secret-dark.png');
  });

  test('rotate secret busy', async ({ page }) => {
    const rotate = await openRotate(page);
    await rotate.holdRotation();
    await rotate.rotate.click();
    await expect(rotate.rotating).toBeVisible();
    await expect(rotate.dialog).toHaveScreenshot('rotate-secret-busy.png');
  });

  test('rotate secret error', async ({ page }) => {
    const rotate = await openRotate(page);
    await rotate.failNextRotation();
    await rotate.rotate.click();
    await expect(rotate.failed).toBeVisible();
    await expect(rotate.dialog).toHaveScreenshot('rotate-secret-error.png');
  });

  test('client secret rotated', async ({ page }) => {
    const rotate = await openRotate(page);
    await rotate.rotateTo('7c1e9a40d2b84f3a', 'Budget', SECRET);
    await rotate.rotate.click();
    const secret = new ClientSecretDialog(page);
    await expect(secret.secret).toHaveValue(SECRET);
    await expect(secret.dialog).toHaveScreenshot('client-secret-rotated.png');
  });

  async function openDelete(page: Page): Promise<DeleteClientDialog> {
    const settings = await openApps(page);
    await settings.chooseAction('Notes', 'Delete');
    const remove = new DeleteClientDialog(page, 'Notes');
    await expect(remove.dialog).toBeVisible();
    return remove;
  }

  test('delete client', async ({ page }) => {
    const remove = await openDelete(page);
    await expect(remove.dialog).toHaveScreenshot('delete-client.png');
  });

  test('delete client on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const remove = await openDelete(page);
    await expect(remove.dialog).toHaveScreenshot('delete-client-phone.png');
  });

  test('delete client busy', async ({ page }) => {
    const remove = await openDelete(page);
    await remove.holdDeletion();
    await remove.confirmName.fill('Notes');
    await remove.delete.click();
    await expect(remove.dialog.getByRole('button', { name: 'Deleting…' })).toBeVisible();
    await expect(remove.dialog).toHaveScreenshot('delete-client-busy.png');
  });

  test('delete client error', async ({ page }) => {
    const remove = await openDelete(page);
    await remove.failNextDeletion();
    await remove.confirmName.fill('Notes');
    await remove.delete.click();
    await expect(remove.failed).toBeVisible();
    await expect(remove.dialog).toHaveScreenshot('delete-client-error.png');
  });
});
