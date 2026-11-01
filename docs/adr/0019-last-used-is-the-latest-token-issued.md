# 0019 An app's "last used" is the latest token ingresso issued it

- Status: accepted (journey 24, advance confirmation from `docs/prompts/24-review-and-revoke-app-access.md`)

## Context

Connected apps shows when each app last used a person's sign-in. OpenIddict records when each authorization and
token was created, but nothing about later use. Logging app requests would store more about the person than
needed (L2-038).

## Decision

- "Approved" is the creation date of the person's earliest valid approval for the app.
- "Last used" is the creation date of the newest token tied to any of the person's authorizations for the app.
  An app gets a new token each time it signs the person in or renews its access token, so this is when it last
  used their sign-in.
- Nothing new is stored, and no content of the app's requests is kept.

## Consequences

- An app that keeps using one unexpired access token shows the time it got that token, not the time it last
  called an API.
- Pruned tokens (OpenIddict's token pruning) can make "last used" fall back to the approval date.
