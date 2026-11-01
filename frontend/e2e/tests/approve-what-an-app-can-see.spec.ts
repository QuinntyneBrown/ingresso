import { expect, test } from '../fixtures';
import { ConsentPage } from '../pages/consent.page';
import { RegisterAppDialog } from '../pages/register-app.dialog';
import { SampleAppPage } from '../pages/sample-app.page';
import { SettingsPage } from '../pages/settings.page';
import { approveThroughApi, SAMPLE_APP_CLIENT_ID } from '../support/apps';
import { signInAsAdministrator, signInAsNewPerson } from '../support/session';

test.describe('Approve what an app can see', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API and the sample app.');

  // Acceptance Test
  // Traces to: L2-121, L2-122
  // Description: The sample app asks for more than sign-in; ingresso names it and lists in plain words what it will see.
  test('an app that asks for more shows what it will see', async ({ page }) => {
    const sample = new SampleAppPage(page);
    const consent = new ConsentPage(page);
    const email = await signInAsNewPerson(page);
    await sample.open();

    await sample.signInWithIngresso.click();
    await consent.waitUntilShown();

    await expect(consent.heading).toHaveText('Sample app wants to use your ingresso account');
    await expect(consent.lead).toContainText(`Signed in as ${email}.`);
    await expect(consent.scopeTitles).toHaveText([
      'See your display name',
      'See your email address',
      'Use Sample API for you',
      'Stay signed in when you’re not using it',
    ]);
  });

  // Acceptance Test
  // Traces to: L2-123
  // Description: Allow returns to the app signed in, and the next sign-in to it does not ask again.
  test('Allow returns to the app and is remembered', async ({ page }) => {
    const sample = new SampleAppPage(page);
    const consent = new ConsentPage(page);
    const email = await signInAsNewPerson(page);
    await sample.open();
    await sample.signInWithIngresso.click();
    await consent.waitUntilShown();

    await consent.allow.click();
    await sample.waitUntilShown();
    await expect(sample.greeting).toHaveText(`Hello, ${email}`);

    await sample.forgetItsSession();
    await sample.open();
    await sample.signInWithIngresso.click();
    await sample.waitUntilShown();
    await expect(sample.greeting).toHaveText(`Hello, ${email}`);
  });

  // Acceptance Test
  // Traces to: L2-123
  // Description: When recording the choice fails, the page says so and stays, so the person can try again.
  test('a failed Allow says so', async ({ page }) => {
    const sample = new SampleAppPage(page);
    const consent = new ConsentPage(page);
    await signInAsNewPerson(page);
    await sample.open();
    await sample.signInWithIngresso.click();
    await consent.waitUntilShown();
    await consent.failNextAllow();

    await consent.allow.click();

    await expect(consent.failed).toBeVisible();
    await expect(consent.allow).toBeEnabled();
  });

  // Acceptance Test
  // Traces to: L2-124
  // Description: Deny returns to the app, which is told no and stays signed out; signing in again asks again.
  test('Deny tells the app no', async ({ page }) => {
    const sample = new SampleAppPage(page);
    const consent = new ConsentPage(page);
    await signInAsNewPerson(page);
    await sample.open();
    await sample.signInWithIngresso.click();
    await consent.waitUntilShown();

    await consent.deny.click();
    await sample.waitUntilShown();

    await expect(sample.denied).toBeVisible();
    await expect(sample.signInWithIngresso).toBeVisible();
    await sample.signInWithIngresso.click();
    await consent.waitUntilShown();
  });

  // Acceptance Test
  // Traces to: L2-125
  // Description: After approving profile and email, the app's next sign-in asks only for its API and staying signed in.
  test('only new scopes are asked for', async ({ page }) => {
    const sample = new SampleAppPage(page);
    const consent = new ConsentPage(page);
    const email = await signInAsNewPerson(page);
    await approveThroughApi(page, SAMPLE_APP_CLIENT_ID, 'openid profile email');
    await sample.open();

    await sample.signInWithIngresso.click();
    await consent.waitUntilShown();

    await expect(consent.heading).toHaveText('Sample app wants to do more');
    await expect(consent.scopeTitles).toHaveText([
      'Use Sample API for you',
      'Stay signed in when you’re not using it',
    ]);
    await expect(consent.approvedBefore).toHaveText(
      'You already let it see your display name and email address.',
    );
    await consent.allow.click();
    await sample.waitUntilShown();
    await expect(sample.greeting).toHaveText(`Hello, ${email}`);
  });

  // Acceptance Test
  // Traces to: L2-126
  // Description: An administrator registers an app as first-party; the edit dialog shows it, and unticking it saves.
  test('an administrator marks an app first-party', async ({ page }) => {
    const settings = new SettingsPage(page);
    const register = new RegisterAppDialog(page);
    await signInAsAdministrator(page);
    await settings.open();
    const name = `Ledger ${Date.now().toString(36)}`;

    await settings.registerApp.click();
    await register.fill({ name, redirectUris: ['https://ledger.example.com/signin-oidc'] });
    await expect(register.firstParty).not.toBeChecked();
    await register.firstParty.check();
    await register.register.click();
    await expect(register.dialog).toBeHidden();

    await settings.chooseAction(name, 'Edit');
    const edit = new RegisterAppDialog(page, `Edit ${name}`);
    await expect(edit.firstParty).toBeChecked();
    await edit.firstParty.uncheck();
    await edit.save.click();
    await expect(edit.dialog).toBeHidden();
    await settings.chooseAction(name, 'Edit');
    await expect(edit.firstParty).not.toBeChecked();
  });
});
