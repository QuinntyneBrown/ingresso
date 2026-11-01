// Acceptance Test
// Traces to: L2-117
// Description: The Profile card and the Edit your profile dialog look as designed in docs/mocks (settings: profile-unset, loading, error, success; edit-profile: default, invalid, busy, error).
import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { AppShell } from '../pages/app-shell';
import { EditProfileDialog } from '../pages/edit-profile.dialog';
import { SettingsPage } from '../pages/settings.page';
import { signInAs } from '../support/session';

test.describe('Share profile details, visually', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  async function openSettings(page: Page, displayName: string | null = 'Maya Reyes'): Promise<SettingsPage> {
    const settings = new SettingsPage(page);
    await signInAs(page);
    await settings.showMockProfile(displayName);
    await settings.showMockConnectedApps();
    await settings.showMockDevices();
    await settings.open();
    await settings.profileShown();
    return settings;
  }

  test('profile unset', async ({ page }) => {
    await openSettings(page, null);
    await expect(page).toHaveScreenshot('profile-unset.png', { fullPage: true });
  });

  test('profile on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openSettings(page);
    await expect(page).toHaveScreenshot('profile-phone.png', { fullPage: true });
  });

  test('profile loading', async ({ page }) => {
    const settings = new SettingsPage(page);
    await signInAs(page);
    await settings.holdProfile();
    await settings.open();
    await expect(settings.profileLoading).toBeVisible();
    await expect(settings.profile).toHaveScreenshot('profile-loading.png');
  });

  test('profile error', async ({ page }) => {
    const settings = new SettingsPage(page);
    await signInAs(page);
    await settings.failProfileOnce();
    await settings.open();
    await expect(settings.profileFailed).toBeVisible();
    await expect(settings.profile).toHaveScreenshot('profile-error.png');
  });

  async function openDialog(page: Page): Promise<EditProfileDialog> {
    const settings = await openSettings(page);
    await settings.editProfile.click();
    const edit = new EditProfileDialog(page);
    await expect(edit.displayName).toHaveValue('Maya Reyes');
    return edit;
  }

  test('edit profile', async ({ page }) => {
    const edit = await openDialog(page);
    await expect(edit.dialog).toHaveScreenshot('edit-profile.png');
  });

  test('edit profile in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const edit = await openDialog(page);
    await expect(edit.dialog).toHaveScreenshot('edit-profile-dark.png');
  });

  test('edit profile invalid', async ({ page }) => {
    const edit = await openDialog(page);
    await edit.displayName.fill('a'.repeat(101));
    await edit.save.click();
    await expect(edit.summary).toBeVisible();
    await expect(edit.dialog).toHaveScreenshot('edit-profile-invalid.png');
  });

  test('edit profile busy', async ({ page }) => {
    const edit = await openDialog(page);
    await edit.holdSave();
    await edit.save.click();
    await expect(edit.saving).toBeVisible();
    await expect(edit.dialog).toHaveScreenshot('edit-profile-busy.png');
  });

  test('edit profile error', async ({ page }) => {
    const edit = await openDialog(page);
    await edit.failNextSave();
    await edit.save.click();
    await expect(edit.failed).toBeVisible();
    await expect(edit.dialog).toHaveScreenshot('edit-profile-error.png');
  });

  test('profile saved', async ({ page }) => {
    const edit = await openDialog(page);
    await page.route('**/api/profile', (route) =>
      route.request().method() === 'PUT'
        ? route.fulfill({
            json: { displayName: 'Maya Reyes', email: 'maya@northwind.com', emailVerified: true },
          })
        : route.fallback(),
    );
    await edit.save.click();
    await expect(new AppShell(page).toast('Profile saved')).toBeVisible();
    await expect(page).toHaveScreenshot('profile-saved.png');
  });
});
