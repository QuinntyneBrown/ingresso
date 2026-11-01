import { expect, test } from '../fixtures';
import { ActivityPage } from '../pages/activity.page';
import { EndSessionDialog } from '../pages/end-session.dialog';
import { SettingsPage } from '../pages/settings.page';
import { signInAs, signInAsNewPerson, signInElsewhere, signInOnAnotherDevice } from '../support/session';

test.describe('Review sign-in activity', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  // Acceptance Test
  // Traces to: L2-142, L2-145
  // Description: Settings links to Activity, which lists the person's sign-in and says how long events are kept.
  test('Settings links to Activity, which lists the person’s sign-in', async ({ page }) => {
    const settings = new SettingsPage(page);
    const activity = new ActivityPage(page);
    await signInAsNewPerson(page);
    await settings.open();

    await settings.viewActivity.click();
    await activity.choose('Sign-ins');

    await expect(activity.heading).toBeVisible();
    await expect(activity.retention).toBeVisible();
    await expect(activity.rows).toHaveCount(1);
    await expect(activity.row('Signed in to ingresso')).toContainText('just now');
  });

  // Acceptance Test
  // Traces to: L2-141, L2-144
  // Description: Ending a session on another device shows under Sessions; the chosen filter stays chosen.
  test('filtering to Sessions shows an ended session', async ({ page, browser, baseURL }) => {
    const settings = new SettingsPage(page);
    const activity = new ActivityPage(page);
    const email = await signInAsNewPerson(page);
    const phone = await signInOnAnotherDevice(browser, baseURL!, email);
    await settings.open();
    await settings.endSessionOn('Safari on iPhone').click();
    await new EndSessionDialog(page).endSession.click();
    await expect(settings.onlyThisDevice).toBeVisible();

    await activity.open();
    await activity.choose('Sessions');
    await activity.choose('Sessions');

    await expect(activity.filter('Sessions')).toHaveAttribute('aria-pressed', 'true');
    await expect(activity.filter('All')).toHaveAttribute('aria-pressed', 'false');
    await expect(activity.rows).toHaveCount(1);
    await expect(activity.row('Ended the session on Safari on iPhone')).toBeVisible();
    await phone.context.close();
  });

  // Acceptance Test
  // Traces to: L2-144
  // Description: Show more adds the next older page below and disappears when there is no more.
  test('Show more adds older events', async ({ page, baseURL }) => {
    const activity = new ActivityPage(page);
    const email = await signInAsNewPerson(page);
    await signInElsewhere(baseURL!, email, 21);
    await activity.open();
    await activity.choose('Sign-ins');
    await expect(activity.rows).toHaveCount(20);

    await activity.showMore.click();

    await expect(activity.rows).toHaveCount(22);
    await expect(activity.showMore).toBeHidden();
  });

  // Acceptance Test
  // Traces to: L2-142
  // Description: With no events, Activity says there is no activity yet.
  test('no activity yet', async ({ page }) => {
    const activity = new ActivityPage(page);
    await signInAs(page);
    await activity.showMockActivity('none');
    await activity.open();

    await expect(activity.empty).toBeVisible();
    await expect(activity.showMore).toBeHidden();
  });

  // Acceptance Test
  // Traces to: L2-142
  // Description: While loading Activity shows placeholders; when loading fails it says so, and Try again loads it.
  test('a failed load says so and Try again recovers', async ({ page }) => {
    const activity = new ActivityPage(page);
    await signInAs(page);
    await activity.failActivityOnce();
    await activity.open();
    await expect(activity.failed).toBeVisible();

    await activity.tryAgain.click();

    await expect(activity.failed).toBeHidden();
    await expect(activity.rows.first()).toBeVisible();
  });
});
