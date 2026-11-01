const SEE = 'see your ';

/** "a", "a and b", "a, b and c"; with "or", "a, b, or c" (a list of alternatives keeps its last comma). */
function joined(parts: readonly string[], word: 'and' | 'or'): string {
  if (parts.length <= 1) return parts[0] ?? '';
  const comma = word === 'or' && parts.length > 2 ? ',' : '';
  return `${parts.slice(0, -1).join(', ')}${comma} ${word} ${parts.at(-1)}`;
}

/**
 * Scope titles as one phrase: lower-cased, with consecutive "see your …" titles said as one clause, and the clauses
 * joined with commas and "and" (or "or"). For example "see your display name and email address, use Sample API for
 * you and stay signed in when you’re not using it" (L2-122).
 */
export function scopePhrase(titles: readonly string[], word: 'and' | 'or' = 'and'): string {
  const clauses: { seen: string[] | null; text: string }[] = [];
  for (const title of titles.map((t) => t.charAt(0).toLowerCase() + t.slice(1))) {
    const last = clauses.at(-1);
    if (!title.startsWith(SEE)) clauses.push({ seen: null, text: title });
    else if (last?.seen) last.seen.push(title.slice(SEE.length));
    else clauses.push({ seen: [title.slice(SEE.length)], text: '' });
  }
  return joined(
    clauses.map((c) => (c.seen ? SEE + joined(c.seen, word === 'or' ? 'or' : 'and') : c.text)),
    word,
  );
}
