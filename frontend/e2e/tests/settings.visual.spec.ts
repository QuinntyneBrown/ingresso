// Acceptance Test
// Traces to: L2-044
// Description: Settings, with the appearance choice, looks as designed in docs/mocks/pages/settings in light and dark.
import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { SettingsPage } from '../pages/settings.page';

test.describe('Settings, visually', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  for (const scheme of ['light', 'dark'] as const) {
    test(`default in ${scheme}`, async ({ page }) => {
      const settings = new SettingsPage(page);
      await page.emulateMedia({ colorScheme: scheme });
      await new DashboardPage(page).open();
      await settings.showMockProfile();
      await settings.showMockConnectedApps();
      await settings.open();
      await expect(settings.heading).toBeVisible();
      await settings.profileShown();
      await expect(settings.choice('Match my system')).toBeChecked();
      await expect(page).toHaveScreenshot(`default-${scheme}.png`, { fullPage: true });
    });
  }
});
