import { Locator, Page } from '@playwright/test';
import { TODAY } from '../fixtures';

export type ActivityFilter = 'All' | 'Sign-ins' | 'App access' | 'Sessions' | 'Apps and keys';

/** Settings → Activity: the person's security events, newest first (L2-142 to L2-145). */
export class ActivityPage {
  readonly heading: Locator;
  readonly backToSettings: Locator;
  readonly retention: Locator;
  readonly filters: Locator;
  readonly rows: Locator;
  readonly showMore: Locator;
  readonly empty: Locator;
  readonly loading: Locator;
  readonly failed: Locator;
  readonly tryAgain: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Activity' });
    this.backToSettings = page.getByRole('link', { name: 'Back to settings' });
    this.retention = page.getByText('ingresso keeps them for 90 days.');
    this.filters = page.getByRole('group', { name: 'Show' });
    this.rows = page.getByRole('list', { name: 'Activity' }).getByRole('listitem');
    this.showMore = page.getByRole('button', { name: 'Show more' });
    this.empty = page.getByRole('heading', { name: 'No activity yet' });
    this.loading = page.locator('[aria-busy="true"]');
    this.failed = page.getByRole('alert').filter({ hasText: 'We couldn’t load your activity' });
    this.tryAgain = page.getByRole('button', { name: 'Try again' });
  }

  async open(): Promise<void> {
    await this.page.goto('/settings/activity');
  }

  filter(name: ActivityFilter): Locator {
    return this.filters.getByRole('button', { name, exact: true });
  }

  async choose(name: ActivityFilter): Promise<void> {
    await this.filter(name).click();
  }

  /** The row whose title is exactly <paramref name="title"/>. */
  row(title: string): Locator {
    return this.rows.filter({ has: this.page.getByText(title, { exact: true }) });
  }

  /** Fails the next activity load with a server error. */
  async failActivityOnce(): Promise<void> {
    let pending = true;
    await this.page.route('**/api/activity*', (route) => {
      if (!pending) return route.fallback();
      pending = false;
      return route.fulfill({ status: 500, json: {} });
    });
  }

  /** Keeps the activity load waiting, to show the loading state. */
  async holdActivity(): Promise<void> {
    await this.page.route('**/api/activity*', () => undefined);
  }

  /**
   * Answers with the mocks' events, timed against the suite's fixed clock: a member's (`mocks`), an administrator's
   * (`admin`), or none. A category in the request filters them, as the API does.
   */
  async showMockActivity(kind: 'mocks' | 'admin' | 'none' = 'mocks'): Promise<void> {
    const ago = (minutes: number) => new Date(TODAY.getTime() - minutes * 60_000).toISOString();
    const day = 24 * 60;
    const event = (
      id: number,
      type: string,
      category: string,
      subject: string,
      minutes: number,
      actor: string | null = null,
    ) => ({
      id,
      type,
      category,
      subject,
      actor,
      occurredAt: ago(minutes),
    });
    const member = [
      event(9, 'signed-in-to-app', 'sign-ins', 'Sample app', 12),
      event(8, 'signed-in', 'sign-ins', 'Chrome on macOS', 15),
      event(6, 'app-approved', 'app-access', 'Sample app', day),
      event(5, 'session-ended', 'sessions', 'Safari on iPhone', 2 * day),
      event(4, 'app-denied', 'app-access', 'Notes', 3 * day),
      event(3, 'signed-in', 'sign-ins', 'Safari on iPhone', 4 * day),
      event(1, 'app-access-revoked', 'app-access', 'Calendar', 6 * day),
    ];
    const admin = [
      ...member.slice(0, 2),
      event(7, 'app-registered', 'apps-and-keys', 'Notes', 60, 'Maya Reyes'),
      ...member.slice(2, 6),
      event(2, 'signing-key-rotated', 'apps-and-keys', '', 5 * day),
      ...member.slice(6),
    ];
    const all = kind === 'none' ? [] : kind === 'admin' ? admin : member;
    await this.page.route('**/api/activity*', (route) => {
      const category = new URL(route.request().url()).searchParams.get('category');
      const events = category ? all.filter((e) => e.category === category) : all;
      return route.fulfill({ json: { events, next: category || kind === 'none' ? null : 1 } });
    });
  }
}
