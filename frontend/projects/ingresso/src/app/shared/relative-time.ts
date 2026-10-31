const formatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

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
  if (!lastOpenedAt) return 'Never opened';
  const seconds = Math.min(0, Math.round((new Date(lastOpenedAt).getTime() - now) / 1000));
  const abs = Math.abs(seconds);
  for (const [unit, size] of UNITS) {
    if (abs >= size) return `Opened ${formatter.format(Math.round(seconds / size), unit)}`;
  }
  return 'Opened just now';
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
