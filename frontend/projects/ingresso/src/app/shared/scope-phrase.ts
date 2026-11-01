const SEE = 'see your ';

/** "a", "a and b", "a, b and c". */
function joined(parts: readonly string[]): string {
  return parts.length <= 1 ? (parts[0] ?? '') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
}

/**
 * Scope titles as one phrase: lower-cased, with consecutive "see your …" titles said as one clause, and the clauses
 * joined with commas and "and". For example "see your display name and email address, use Sample API for you and
 * stay signed in when you’re not using it" (L2-122).
 */
export function scopePhrase(titles: readonly string[]): string {
  const clauses: { seen: string[] | null; text: string }[] = [];
  for (const title of titles.map((t) => t.charAt(0).toLowerCase() + t.slice(1))) {
    const last = clauses.at(-1);
    if (!title.startsWith(SEE)) clauses.push({ seen: null, text: title });
    else if (last?.seen) last.seen.push(title.slice(SEE.length));
    else clauses.push({ seen: [title.slice(SEE.length)], text: '' });
  }
  return joined(clauses.map((c) => (c.seen ? SEE + joined(c.seen) : c.text)));
}
