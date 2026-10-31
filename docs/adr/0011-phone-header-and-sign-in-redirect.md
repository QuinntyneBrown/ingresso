# 0011 Phone header keeps its actions; 401 redirects to /sign-in

- Status: accepted (scaffold run, advance confirmation from `docs/prompts/00-scaffold.md`)

## Context

L2-043 says the header's navigation collapses into a menu button at XS width. The mocks have no header
navigation: the header holds the brand, the search, Edit layout, Add app and the avatar, and below 768 px the
search drops to a second row. The only menu in the design is the account menu behind the avatar (journey 11).
L2-033 says an anonymous visitor is redirected to sign-in, but the sign-in screen is journey 01.

## Decision

- The header stays as mocked at phone width. There is no navigation to collapse, so no menu button is added; the
  account menu arrives with the sign-out journey. Touch targets (44 px on coarse pointers) and the full-screen
  dialog at XS are what the scaffold delivers and tests for L2-043.
- One interceptor in the app turns any 401 into a navigation to `/sign-in`. Until journey 01 builds that screen,
  the route falls through to the not-found page.

## Consequences

Journey 01 adds the `/sign-in` route and screen; the redirect and its test need no change. If a header
navigation is ever designed, L2-043 criterion 2 gets a test then.
