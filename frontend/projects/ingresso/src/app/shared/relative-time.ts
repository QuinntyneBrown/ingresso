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

/** "Approved 12 Oct 2026 · Last used 2 hours ago", or "· Not used yet" (L2-128, ADR 0019). */
export function connectedLabel(approvedAt: string, lastUsedAt: string | null, now = Date.now()): string {
  const date = new Date(approvedAt);
  const approved = `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  return `Approved ${approved} · ${lastUsedAt ? `Last used ${agoLabel(lastUsedAt, now)}` : 'Not used yet'}`;
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
