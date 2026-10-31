const formatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "Opened 8 minutes ago", or "Not opened yet" when the app was never opened. */
export function openedLabel(lastOpenedAt: string | null | undefined, now = Date.now()): string {
  if (!lastOpenedAt) return 'Not opened yet';
  const seconds = Math.round((new Date(lastOpenedAt).getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return 'Opened just now';
  for (const [unit, size] of UNITS) {
    if (abs >= size) return `Opened ${formatter.format(Math.round(seconds / size), unit)}`;
  }
  return 'Opened just now';
}

/** "Good morning", "Good afternoon" or "Good evening" for a local hour. */
export function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
