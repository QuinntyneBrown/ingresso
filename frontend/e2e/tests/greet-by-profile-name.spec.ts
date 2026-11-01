import { expect, test } from '../fixtures';
import { AppShell } from '../pages/app-shell';
import { DashboardPage } from '../pages/dashboard.page';
import { EditProfileDialog } from '../pages/edit-profile.dialog';
import { SettingsPage } from '../pages/settings.page';
import { SignOutDialog } from '../pages/sign-out.dialog';
import { signInAsAdministrator, signInAsNewPerson } from '../support/session';

test.describe('Greet by profile name', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  // Acceptance Test
  // Traces to: L2-146
  // Description: A person with a display name sees "Hi, {display name}" with the whole name, and no Add your name.
  test('a person with a display name is greeted by it', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.open();

    await expect(dashboard.heading).toHaveText('Hi, Maya Okafor');
    await expect(dashboard.addYourName).toBeHidden();
  });

  // Acceptance Test
  // Traces to: L2-146
  // Description: A person without a display name sees "Hi there" and Add your name, and never their email address.
  test('a person without a display name is greeted without their email', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const email = await signInAsNewPerson(page);
    await dashboard.openSignedIn();

    await expect(dashboard.heading).toHaveText('Hi there');
    await expect(dashboard.heading).not.toContainText(email);
    await expect(dashboard.addYourName).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-146, L2-117
  // Description: Add your name opens Edit your profile; saving greets the person by the new name without a reload.
  test('adding a name from the dashboard greets the person by it at once', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const shell = new AppShell(page);
    const edit = new EditProfileDialog(page);
    const email = await signInAsNewPerson(page);
    await dashboard.openSignedIn();
    await dashboard.markPageLoad();

    await dashboard.addYourName.click();
    await expect(edit.dialog).toBeVisible();
    await expect(edit.displayName).toHaveValue('');
    await expect(edit.email).toContainText(email);
    await edit.displayName.fill('Maya Reyes');
    await edit.save.click();

    await expect(edit.dialog).toBeHidden();
    await expect(shell.toast('Profile saved')).toBeVisible();
    await expect(dashboard.heading).toHaveText('Hi, Maya Reyes');
    await expect(dashboard.addYourName).toBeHidden();
    await expect(shell.avatar).toContainText('MR');
    expect(await dashboard.wasReloaded()).toBe(false);
  });

  // Acceptance Test
  // Traces to: L2-146
  // Description: Cancelling Edit your profile changes nothing and returns focus to Add your name.
  test('cancelling leaves the greeting as it was', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const edit = new EditProfileDialog(page);
    await signInAsNewPerson(page);
    await dashboard.openSignedIn();

    await dashboard.addYourName.click();
    await edit.cancel.click();

    await expect(edit.dialog).toBeHidden();
    await expect(dashboard.heading).toHaveText('Hi there');
    await expect(dashboard.addYourName).toBeFocused();
  });

  // Acceptance Test
  // Traces to: L2-146, L2-117
  // Description: Changing, then clearing, the name in Settings shows on the dashboard without a reload.
  test('changing or clearing the name in Settings updates the greeting', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const shell = new AppShell(page);
    const settings = new SettingsPage(page);
    const edit = new EditProfileDialog(page);
    await signInAsNewPerson(page);
    await dashboard.openSignedIn();
    await dashboard.markPageLoad();

    await shell.accountMenu.click();
    await shell.settingsItem.click();
    await settings.editProfile.click();
    await edit.displayName.fill('Ada Lovelace');
    await edit.save.click();
    await expect(edit.dialog).toBeHidden();
    await settings.backToApps.click();
    await expect(dashboard.heading).toHaveText('Hi, Ada Lovelace');

    await shell.accountMenu.click();
    await shell.settingsItem.click();
    await settings.editProfile.click();
    await edit.displayName.fill('');
    await edit.save.click();
    await expect(edit.dialog).toBeHidden();
    await settings.backToApps.click();

    await expect(dashboard.heading).toHaveText('Hi there');
    await expect(dashboard.addYourName).toBeVisible();
    expect(await dashboard.wasReloaded()).toBe(false);
  });

  // Acceptance Test
  // Traces to: L2-146
  // Description: The saved name is still the greeting after signing out and signing in again.
  test('the name survives signing out and in again', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const shell = new AppShell(page);
    const edit = new EditProfileDialog(page);
    const signOut = new SignOutDialog(page);
    const email = await signInAsNewPerson(page);
    await dashboard.openSignedIn();
    await dashboard.addYourName.click();
    await edit.displayName.fill('Maya Reyes');
    await edit.save.click();
    await expect(dashboard.heading).toHaveText('Hi, Maya Reyes');

    await shell.accountMenu.click();
    await shell.signOutItem.click();
    await expect(signOut.signedInAs).toHaveText(`Signed in as Maya Reyes · ${email}`);
    await signOut.signOut.click();
    await expect(page).toHaveURL(/\/sign-in/);
    await signInAsAdministrator(page, email);
    await dashboard.openSignedIn();

    await expect(dashboard.heading).toHaveText('Hi, Maya Reyes');
    await expect(dashboard.addYourName).toBeHidden();
  });
});
