/** The icon colours offered when adding or editing an app. */
export const APP_COLORS: { value: string; label: string }[] = [
  { value: '#CF3B20', label: 'Vermilion' },
  { value: '#2563EB', label: 'Blue' },
  { value: '#1B6B3C', label: 'Green' },
  { value: '#A15F00', label: 'Amber' },
  { value: '#6D28D9', label: 'Violet' },
  { value: '#0F766E', label: 'Teal' },
  { value: '#BE185D', label: 'Pink' },
  { value: '#17181C', label: 'Ink' },
];

/** One or two initials for an app name: "Northwind Billing" gives "NB", "Statuspage" gives "S". */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}
