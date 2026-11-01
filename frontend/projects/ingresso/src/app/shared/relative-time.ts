const formatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

/** Fixed short month names: locales disagree ("Sep" or "Sept"). */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/**
 * "Opened 8 minutes ago", or "Never opened". A time ahead of this browser's clock (the server's clock can run
 * a little ahead) is never shown as the future: it reads "Opened just now".
 */
export function openedLabel(lastOpenedAt: string | null | undefined, now = Date.now()): string {
  return lastOpenedAt ? `Opened ${agoLabel(lastOpenedAt, now)}` : 'Never opened';
}

/** "8 minutes ago", or "just now"; a time ahead of this browser's clock reads "just now", never the future. */
export function agoLabel(at: string, now = Date.now()): string {
  const seconds = Math.min(0, Math.round((new Date(at).getTime() - now) / 1000));
  const abs = Math.abs(seconds);
  for (const [unit, size] of UNITS) {
    if (abs >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

/** "12 Oct 2026", with fixed month names. */
export function shortDate(at: string): string {
  const date = new Date(at);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** "Approved 12 Oct 2026 · Last used 2 hours ago", or "· Not used yet" (L2-128, ADR 0019). */
export function connectedLabel(approvedAt: string, lastUsedAt: string | null, now = Date.now()): string {
  return `Approved ${shortDate(approvedAt)} · ${lastUsedAt ? `Last used ${agoLabel(lastUsedAt, now)}` : 'Not used yet'}`;
}

/**
 * "Active now · Signed in 28 Oct 2026", or "Last active 3 hours ago · …". Sessions note activity at most every 5
 * minutes, so anything newer, and this device, is "Active now" (L2-132).
 */
export function deviceLabel(
  signedInAt: string,
  lastActiveAt: string,
  current: boolean,
  now = Date.now(),
): string {
  const active = current || now - new Date(lastActiveAt).getTime() < 5 * 60_000;
  return `${active ? 'Active now' : `Last active ${agoLabel(lastActiveAt, now)}`} · Signed in ${shortDate(signedInAt)}`;
}

/** The exact time of the last open, such as "Saturday, October 31, 2026 at 9:50 PM"; empty when never opened. */
export function openedTitle(lastOpenedAt: string | null | undefined): string | null {
  if (!lastOpenedAt) return null;
  return new Date(lastOpenedAt).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
}

/** "Good morning", "Good afternoon" or "Good evening" for a local hour. */
export function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const TITLES: Record<string, (subject: string) => string> = {
  'signed-in': () => 'Signed in to ingresso',
  'signed-in-to-app': (s) => `Signed in to ${s}`,
  'app-approved': (s) => `Approved ${s}`,
  'app-denied': (s) => `Denied ${s}`,
  'app-access-revoked': (s) => `Revoked ${s}’s access`,
  'session-ended': (s) => `Ended the session on ${s}`,
  'other-sessions-ended': () => 'Signed out of other devices',
  'app-registered': (s) => `Registered ${s}`,
  'app-updated': (s) => `Edited ${s}`,
  'app-secret-rotated': (s) => `Rotated ${s}’s secret`,
  'app-disabled': (s) => `Disabled ${s}`,
  'app-enabled': (s) => `Enabled ${s}`,
  'app-deleted': (s) => `Deleted ${s}`,
  'signing-key-rotated': () => 'Rotated the signing key',
};

/** What a security event says happened, such as "Signed in to Sample app" (L2-142). */
export function activityTitle(event: { type: string; subject: string }): string {
  return TITLES[event.type]?.(event.subject) ?? event.type;
}

/**
 * Where or by whom, when known, and when: "Chrome on macOS · 15 minutes ago", "By Maya Reyes · 1 hour ago",
 * "From the CLI · 5 days ago" or "Yesterday" (L2-142, L2-143).
 */
export function activityMeta(
  event: { type: string; category: string; subject: string; actor: string | null; occurredAt: string },
  now = Date.now(),
): string {
  const where =
    event.type === 'signed-in'
      ? event.subject
      : event.category !== 'apps-and-keys'
        ? ''
        : event.actor
          ? `By ${event.actor}`
          : event.subject === 'scheduled'
            ? 'On schedule'
            : 'From the CLI';
  const when = agoLabel(event.occurredAt, now);
  return where ? `${where} · ${when}` : when.charAt(0).toUpperCase() + when.slice(1);
}
