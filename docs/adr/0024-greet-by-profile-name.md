# 0024 The dashboard says "Hi" to the profile name

- Status: accepted (journey 28, advance confirmation from `docs/prompts/28-greet-by-profile-name.md`)

## Context

The dashboard heading read "Good morning/afternoon/evening, {first word of name}", where the name came from
`GET /api/auth/me` as `Name = User.Name ?? User.Email`. A person without a display name was greeted by their whole
email address, which overflowed the page at phone width, and a person with a display name saw only its first word.
The client could not tell a name from an address because the API merged them into one field.

## Decision

- The heading reads "Hi, {display name}" with the whole saved name, or "Hi there" when no name is set. The
  time-of-day greeting is dropped: it depended on the browser's clock, added nothing a person acts on, and a
  one-word "Hi" leaves more room for a long name.
- With no name, the intro offers "Add your name", a link-style `Button` that opens the existing Edit your profile
  dialog. It disappears once a name is saved.
- `GET /api/auth/me` returns `displayName` (null when not set) beside `email`, and no longer returns `name`. The
  only other reader of `name` was the Sign out dialog, which now shows "Signed in as {displayName} · {email}", or
  "Signed in as {email}" without a name, so keeping a merged field would only invite the old guess.
- The header initials, the `profile` and `email` claims apps receive, and how the name is stored and validated
  (L2-117) are unchanged.

## Consequences

- The heading never shows an email address and wraps instead of scrolling sideways.
- Clients of `/api/auth/me` that read `name` must read `displayName ?? email` themselves; within this repository
  that is only the Sign out dialog.
- A time-of-day greeting could come back later as a preference; it is deferred.
