import { expect, test } from '../fixtures';
import { AppShell } from '../pages/app-shell';
import { EditProfileDialog } from '../pages/edit-profile.dialog';
import { SampleAppPage } from '../pages/sample-app.page';
import { SettingsPage } from '../pages/settings.page';
import { signInAsNewPerson } from '../support/session';

test.describe('Share profile details with apps', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  // Acceptance Test
  // Traces to: L2-117
  // Description: The Profile card shows the email and "Not set" until a display name is saved; saving updates the card and the header.
  test('setting a display name in Settings', async ({ page }) => {
    const settings = new SettingsPage(page);
    const shell = new AppShell(page);
    const edit = new EditProfileDialog(page);
    const email = await signInAsNewPerson(page);
    await settings.open();
    await expect(settings.profileValue('Email')).toHaveText(email);
    await expect(settings.profileValue('Display name')).toHaveText(
      'Not set. Your greeting and apps use your email.',
    );

    await settings.editProfile.click();
    await expect(edit.email).toContainText(email);
    await edit.displayName.fill('  Maya Reyes  ');
    await edit.save.click();

    await expect(shell.toast('Profile saved')).toBeVisible();
    await expect(edit.dialog).toBeHidden();
    await expect(settings.profileValue('Display name')).toHaveText('Maya Reyes');
    await expect(shell.avatar).toContainText('MR');
  });

  // Acceptance Test
  // Traces to: L2-117
  // Description: Clearing the name returns the card to "Not set".
  test('clearing the display name', async ({ page }) => {
    const settings = new SettingsPage(page);
    const edit = new EditProfileDialog(page);
    await signInAsNewPerson(page);
    await settings.open();
    await settings.editProfile.click();
    await edit.displayName.fill('Maya Reyes');
    await edit.save.click();
    await expect(settings.profileValue('Display name')).toHaveText('Maya Reyes');

    await settings.editProfile.click();
    await expect(edit.displayName).toHaveValue('Maya Reyes');
    await edit.displayName.fill('');
    await edit.save.click();

    await expect(settings.profileValue('Display name')).toHaveText(
      'Not set. Your greeting and apps use your email.',
    );
  });

  // Acceptance Test
  // Traces to: L2-117
  // Description: A name over 100 characters keeps the dialog open with the message.
  test('a name that is too long is refused', async ({ page }) => {
    const settings = new SettingsPage(page);
    const edit = new EditProfileDialog(page);
    await signInAsNewPerson(page);
    await settings.open();

    await settings.editProfile.click();
    await edit.displayName.fill('a'.repeat(101));
    await edit.save.click();

    await expect(edit.summary).toContainText('Keep your display name to 100 characters or fewer.');
    await expect(edit.dialog).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-117
  // Description: A failed save keeps the dialog open with the entry and says so.
  test('a failed save says so', async ({ page }) => {
    const settings = new SettingsPage(page);
    const edit = new EditProfileDialog(page);
    await signInAsNewPerson(page);
    await settings.open();
    await edit.failNextSave();

    await settings.editProfile.click();
    await edit.displayName.fill('Maya Reyes');
    await edit.save.click();

    await expect(edit.failed).toBeVisible();
    await expect(edit.displayName).toHaveValue('Maya Reyes');
  });

  // Acceptance Test
  // Traces to: L2-117
  // Description: When the profile can't load, the card says so and Try again loads it.
  test('a profile that fails to load can be tried again', async ({ page }) => {
    const settings = new SettingsPage(page);
    const email = await signInAsNewPerson(page);
    await settings.failProfileOnce();
    await settings.open();

    await expect(settings.profileFailed).toContainText('We couldn’t load your profile');
    await settings.profileTryAgain.click();

    await expect(settings.profileValue('Email')).toHaveText(email);
  });

  // Acceptance Test
  // Traces to: L2-118, L2-117
  // Description: The sample app, asking for profile, greets the person by the display name set in Settings.
  test('the sample app greets the person by their display name', async ({ page }) => {
    const settings = new SettingsPage(page);
    const edit = new EditProfileDialog(page);
    const sample = new SampleAppPage(page);
    await signInAsNewPerson(page);
    await settings.open();
    await settings.editProfile.click();
    await edit.displayName.fill('Maya Reyes');
    await edit.save.click();
    await expect(settings.profileValue('Display name')).toHaveText('Maya Reyes');

    await sample.open();
    await sample.signInWithIngresso.click();
    await sample.waitUntilSignedIn();

    await expect(sample.greeting).toHaveText('Hello, Maya Reyes');
  });

  // Acceptance Test
  // Traces to: L2-118
  // Description: Without a display name, the sample app greets the person by their email.
  test('without a display name the sample app uses the email', async ({ page }) => {
    const sample = new SampleAppPage(page);
    const email = await signInAsNewPerson(page);

    await sample.open();
    await sample.signInWithIngresso.click();
    await sample.waitUntilSignedIn();

    await expect(sample.greeting).toHaveText(`Hello, ${email}`);
  });

  // Acceptance Test
  // Traces to: L2-117
  // Description: A display name that looks like markup is shown as text in Settings and in the app.
  test('a display name is always text', async ({ page }) => {
    const settings = new SettingsPage(page);
    const edit = new EditProfileDialog(page);
    const sample = new SampleAppPage(page);
    await signInAsNewPerson(page);
    await settings.open();
    await settings.editProfile.click();
    await edit.displayName.fill('<b>Maya</b>');
    await edit.save.click();

    await expect(settings.profileValue('Display name')).toHaveText('<b>Maya</b>');
    await sample.open();
    await sample.signInWithIngresso.click();
    await sample.waitUntilSignedIn();
    await expect(sample.greeting).toHaveText('Hello, <b>Maya</b>');
  });
});
