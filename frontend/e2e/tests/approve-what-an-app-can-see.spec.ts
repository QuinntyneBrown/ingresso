import { expect, test } from '../fixtures';
import { ConsentPage } from '../pages/consent.page';
import { SampleAppPage } from '../pages/sample-app.page';
import { signInAsNewPerson } from '../support/session';

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
});
