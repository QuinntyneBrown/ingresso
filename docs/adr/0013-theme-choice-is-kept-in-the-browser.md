# 0013 The theme choice is kept in this browser

- Status: accepted (journey 14, advance confirmation from `docs/prompts/14-switch-theme.md`)

## Context

L2-044 says a chosen theme is kept when the person reloads. The choice could live with the account (an API
field) or in the browser.

## Decision

Keep it in the browser's `localStorage` under `ingresso.theme` (`light` or `dark`; absent means follow the
system). `ThemeStore` reads it when the app starts, before any screen shows, and sets `data-theme` on the root
element; with no choice the stylesheet follows `prefers-color-scheme`. The choice applies at once, with no Save
step.

## Consequences

- It works before sign-in (the sign-in screen is themed too) and needs no API change.
- It is per device, not per account. Syncing it across devices is deferred.
- The mock's Profile section, Save changes and notification switches are deferred; only Appearance is built.
