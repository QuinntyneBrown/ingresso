import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { SettingsPage } from '../pages/settings.page';

test.describe('Switch theme', () => {
  // Acceptance Test
  // Traces to: L2-044
  // Description: With no choice made, the app follows the system theme.
  test('follows the system theme on first load', async ({ page }) => {
    const settings = new SettingsPage(page);

    await page.emulateMedia({ colorScheme: 'dark' });
    await settings.open();
    await expect.poll(() => settings.shownTheme()).toBe('dark');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect.poll(() => settings.shownTheme()).toBe('light');
  });

  // Acceptance Test
  // Traces to: L2-044
  // Description: Settings is reached from the account menu and offers Match my system, Light and Dark; the choice applies at once.
  test('Settings is in the account menu and the choice applies at once', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const settings = new SettingsPage(page);
    await page.emulateMedia({ colorScheme: 'light' });
    await dashboard.open();

    await dashboard.shell.accountMenu.click();
    await page.getByRole('menuitem', { name: 'Settings' }).click();

    await expect(settings.heading).toBeVisible();
    await expect(settings.choice('Match my system')).toBeChecked();
    await settings.choose('Dark');
    await expect.poll(() => settings.shownTheme()).toBe('dark');
    await settings.choose('Light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(() => settings.shownTheme()).toBe('light');
    await settings.choose('Match my system');
    await expect.poll(() => settings.shownTheme()).toBe('dark');
  });

  // Acceptance Test
  // Traces to: L2-044
  // Description: The chosen theme is kept when the app is opened again, on every screen.
  test('the choice is kept across reloads', async ({ page }) => {
    const settings = new SettingsPage(page);
    const dashboard = new DashboardPage(page);
    await page.emulateMedia({ colorScheme: 'light' });
    await dashboard.open();
    await settings.open();

    await settings.choose('Dark');
    await page.reload();

    await expect(settings.choice('Dark')).toBeChecked();
    await expect.poll(() => settings.shownTheme()).toBe('dark');
    await settings.backToApps.click();
    await expect(dashboard.tiles.first()).toBeVisible();
    await expect.poll(() => settings.shownTheme()).toBe('dark');
  });

  // Acceptance Test
  // Traces to: L2-044
  // Description: In either theme, the text on the dashboard and on Settings meets WCAG 2.2 AA contrast (4.5:1).
  for (const scheme of ['light', 'dark'] as const) {
    test(`text contrast is at least 4.5 to 1 in ${scheme}`, async ({ page }) => {
      const settings = new SettingsPage(page);
      const dashboard = new DashboardPage(page);
      await page.emulateMedia({ colorScheme: scheme });

      await dashboard.open();
      await expect(dashboard.tiles.first()).toBeVisible();
      const onDashboard = await settings.lowestTextContrast();
      await settings.open();
      await expect(settings.heading).toBeVisible();
      const onSettings = await settings.lowestTextContrast();

      expect(onDashboard.ratio, `dashboard text "${onDashboard.text}"`).toBeGreaterThanOrEqual(4.5);
      expect(onSettings.ratio, `settings text "${onSettings.text}"`).toBeGreaterThanOrEqual(4.5);
    });
  }
});
