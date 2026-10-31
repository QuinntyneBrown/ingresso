import { expect, test } from '../fixtures';
import { AddAppDialog } from '../pages/add-app.dialog';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Keyboard and focus', () => {
  // Acceptance Test
  // Traces to: L2-045
  // Description: A skip link is the first focusable item and moves focus to the main content.
  test('the skip link is the first stop and jumps to the main content', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.open();

    await dashboard.shell.tab();
    await expect(dashboard.shell.skipLink).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(dashboard.shell.main).toBeFocused();
  });

  // Acceptance Test
  // Traces to: L2-045
  // Description: Tabbing follows reading order and the focused control shows a visible indicator.
  test('tabbing reaches the header controls in reading order with a visible focus indicator', async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();

    await dashboard.shell.tab(2);
    await expect(dashboard.shell.brand).toBeFocused();
    await dashboard.shell.tab();
    await expect(dashboard.shell.search).toBeFocused();
    await dashboard.shell.tab();
    await expect(dashboard.shell.editLayout).toBeFocused();
    await dashboard.shell.tab();
    await expect(dashboard.shell.addApp).toBeFocused();
    expect(await dashboard.shell.addApp.evaluate(hasFocusIndicator)).toBe(true);
  });

  // Acceptance Test
  // Traces to: L2-045
  // Description: A dialog takes focus, traps it, and returns it to the opener when closed.
  test('a dialog traps focus and gives it back to the button that opened it', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const dialog = new AddAppDialog(page);
    await dashboard.open();

    await dashboard.shell.addApp.click();
    await expect(dialog.dialog).toBeVisible();
    await expect(dialog.dialog.locator(':focus')).toHaveCount(1);
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      await expect(dialog.dialog.locator(':focus')).toHaveCount(1);
    }

    await page.keyboard.press('Escape');
    await expect(dialog.dialog).toBeHidden();
    await expect(dashboard.shell.addApp).toBeFocused();
  });

  // Acceptance Test
  // Traces to: L2-045
  // Description: Toasts are announced to assistive technology through a polite live region.
  test('toasts appear in a live region', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.open();

    await expect(dashboard.shell.toastRegion).toHaveAttribute('role', 'status');
    await expect(dashboard.shell.toastRegion).toHaveAttribute('aria-live', 'polite');
  });
});

test.describe('On a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  // Acceptance Test
  // Traces to: L2-043
  // Description: On a touch device every header control is at least 44 by 44 CSS pixels and the page does not scroll sideways.
  test('header controls are 44 pixels tall and nothing overflows', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.open();

    for (const control of [dashboard.shell.addApp, dashboard.shell.editLayout, dashboard.shell.search]) {
      const box = await control.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    // Every header control sits fully inside the 390 px screen, not clipped at the edge.
    for (const control of [dashboard.shell.addApp, dashboard.shell.editLayout, dashboard.shell.avatar]) {
      const box = (await control.boundingBox())!;
      expect(box.x + box.width).toBeLessThanOrEqual(390);
    }
  });

  // Acceptance Test
  // Traces to: L2-043
  // Description: At phone width a dialog fills the screen and its actions stay reachable.
  test('a dialog fills the screen and its actions stay reachable', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const dialog = new AddAppDialog(page);
    await dashboard.open();

    await dashboard.shell.addApp.click();

    const box = await dialog.dialog.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(388);
    await dialog.submit.scrollIntoViewIfNeeded();
    await expect(dialog.submit).toBeInViewport();
    const submit = await dialog.submit.boundingBox();
    expect(submit!.height).toBeGreaterThanOrEqual(44);
  });
});

/** True when the element draws an outline or a ring while focused. */
function hasFocusIndicator(el: Element): boolean {
  const style = getComputedStyle(el);
  const outline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
  return outline || style.boxShadow !== 'none';
}
