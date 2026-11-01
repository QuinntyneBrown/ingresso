# Screen composition

Binding map from each screen in [`docs/mocks/`](mocks/README.md) to the `ig-*` components in
`frontend/projects/components` (public API: `frontend/projects/components/src/public-api.ts`; catalogue:
[`docs/design-system/`](design-system/README.md)). Build every screen from the components listed here.
**Local UI** is markup the app builds itself because the library has no matching component; build it once and
reuse it where noted. Mock-only chrome (`mock-bar`, `mock-note`) is excluded. Dialog mocks repeat the dashboard
behind their backdrop; only the dialog is mapped.

## Shell

| Part        | Library components                                                                                                                                                                                                                                   | Local UI         |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Skip link   | `SkipLink`                                                                                                                                                                                                                                           | —                |
| Header      | `SiteHeader`, `Logo`, `Search` (`/` shortcut), `Button` (Edit layout / Done, Add app), `Tooltip` (`placement="below"`, edit unavailable below 1024px), `Avatar`, `MenuTrigger` + `Menu` + `MenuItem` (account menu: Settings and Sign out so far; Brand guide joins in its journey; the trigger is a ghost icon `Button` holding the `Avatar`) | —                |
| Footer      | `SiteFooter`                                                                                                                                                                                                                                         | Footer note copy |
| Toasts      | `ToastService`, `ToastRegion`, `Toast`                                                                                                                                                                                                               | —                |
| Site banner | `Alert` with `banner`                                                                                                                                                                                                                                | —                |

## Shared local components

| Item                                        | Used by                               | Notes                                                                                              |
| ------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Page intro (greeting `h1` and summary line) | dashboard, directory, settings, brand | Layout with `Stack`; text only                                                                     |
| Auth layout (centred `Card` with `Logo`)    | sign-in, reset-password, signed-out   | Wraps `Card`; build once                                                                           |
| App form (`AppForm`)                        | add-app, edit-app                     | Composed of `FormField`, `Input`, `FieldSet`, `Choice`, `Check`, `AppIcon` preview, `ErrorSummary` |

## Pages

### Dashboard — `/` (`pages/dashboard`: default, loading, empty, error, no-results, search-results, editing, editing-refused, editing-narrow, offline)

- Library: `TileGrid` + `TileGridTile` (tiles; collapse below 1024px; `ResizeObserver`-measured columns), `AppTile`
  (one per cell; large when a tile spans at least 4 by 3; `highlighted` for the quick-jump match), `LayoutBar` (editing; actions are `Button`s), `Skeleton`
  (loading), `EmptyState` (empty; no-results with `compact`), `Alert` (error with Try again; offline as
  `banner`), `Button`, `Icon`.
- Local: page intro; mapping tiles to `TileGridItem` with the L2-051 limits; tile chrome turned off on the grid
  (`--ig-tile-grid-tile-*` knobs) because `AppTile` draws the card.

### Directory — `/directory` (`pages/directory`: default, loading, empty (no matches), search-results, error)

- Library: `List` + `ListItem` (`variant="catalog"`), `AppIcon`, `Button` (Add), `Badge` (Added), `Search`,
  `Link` (`variant="back"`), `Skeleton`, `EmptyState`, `Alert`.
- Local: page intro; directory sections (`dir-section`, an `h3` per category). `Search` is given an empty `shortcut` so
  it does not compete with the header's `/`. `EmptyState` is the no-matches state. The Add app dialog's
  "Browse directory" is a `Button` (`ghost`) that closes the dialog and routes here.

### Sign in — `/sign-in` (`pages/sign-in`: default, invalid, submitting, error, sent, expired, used, link-invalid, rate-limited, for-app, for-app-sent)

- Library: `Card`, `Logo`, `FormField`, `Input`, `ErrorSummary` (invalid), `Button` (`busy` while submitting;
  "Use a different email" in sent), `Alert` (`success` for sent; `warning` for expired, used and rate-limited;
  `danger` for link-invalid and error), `SkipLink`.
- Local: auth layout (`shared/auth-layout`). The screen sits outside the shell: no header, footer or session load.
- `for-app` and `for-app-sent` (journey 16): the same components; the heading and lead name the app the person is
  signing in to, looked up from the `returnUrl`'s `client_id`.

### Verify your email — `/verify-email` (`pages/verify-email`: default, sending, sent, rate-limited, error, link-invalid)

- Library: `Card`, `Logo`, `Button` (`busy` while sending; Send another email, Sign out), `Alert` (`success` for sent;
  `warning` for rate-limited and link-invalid; `danger` for error), `SkipLink`.
- Local: auth layout (`shared/auth-layout`). The screen sits outside the shell; unverified accounts are redirected here.

### Reset password — `/reset-password` (`pages/reset-password`: default, invalid, submitting, success, error)

- Library: as sign-in, plus `Alert` (`success`).
- Local: auth layout.

### Settings — `/settings` (`pages/settings`: default, loading, error, success, profile-unset)

- Library: `Card` (one per section, `title`), `FormField`, `Input`, `Choice` + `Check` (theme), `Switch`,
  `ErrorSummary`, `Button`, `Link` (`variant="back"`), `Skeleton`, `Alert`.
- Local: page intro; the card header row.
- Built so far (ADR 0013): `Link` (`variant="back"`) and the Appearance `Card` with `FieldSet`, `Choice` and `Check`, applied at once with no Save. Notification switches are deferred.
- Profile (journey 22, ADR 0017; `default`, `loading`, `error`, `success`, `profile-unset`): a `Card` with a secondary
  `Button` (`edit` icon, Edit profile) that opens the edit-profile dialog, and a `List` (`surface`) of two
  `ListItem`s (`title` = Display name or Email, `meta` = the value, or “Not set. Your greeting and apps use your
  email.”). `Skeleton` while loading; a danger `Alert` with a Try again `Button` on error; a success toast through
  `ToastService` after saving. Local: the card's header row (title, lead and button), shared with Apps.
- Apps (journey 19, `apps`, `apps-empty`, `apps-loading`, `apps-error`; administrators only): a `Card` with a
  primary `Button` (Register an app), `List` (`surface`) of `ListItem` (`title` = app name, `meta` = type and
  client ID), `EmptyState` with a primary `Button` when there are none, `Skeleton` while loading, and a danger
  `Alert` with a Try again `Button` on error. Local: the card's header row (title, lead and button).
- Apps row actions (journey 21, `apps`, `apps-menu`): each `ListItem`'s `[slot=action]` holds a neutral `Badge`
  (Disabled) when the app is disabled and a ghost icon `Button` (`more`, “Actions for <name>”) with
  `MenuTrigger` + `Menu` + `MenuItem`: Edit, Rotate secret (confidential apps), Disable or Enable, a
  `MenuDivider`, and Delete (`kind="danger"`). Changes are confirmed with `ToastService` toasts.

### Brand guide — `/brand` (`pages/brand`: default, loading, error)

- Library: `Card`, `Logo`, `List` (`catalog`), `Cluster`, `Stack`, `Link` (`variant="back"`), `Skeleton`,
  `Alert`.
- Local: colour swatches and logo specimens.

### Status pages — `/**`, `/forbidden`, `/error`, `/offline` (`pages/not-found`, `pages/forbidden`, `pages/server-error`, `pages/offline`: default)

- Library: `StatusPage`, `Button`, `Cluster`.
- Local: none.

### Can’t sign in to this app — `/authorize-error` (`pages/authorize-error`: default, sign-out)

- Library: `SiteHeader` (brand slot only, with `Logo`), `StatusPage`, `Button`.
- Local: none. The screen sits outside the shell, because the person may be signed out.
- `sign-out` (journey 18, `?flow=sign-out`): the same components; the heading and message say the app can't sign
  the person out, for a sign-out request ingresso cannot trust.

### Approve an app — `/consent` (`pages/consent`: default, loading, busy, error, new-scopes)

- Library: `Card`, `Logo`, `List` with `ListItem` on a `surface` (one row per scope: the plain-language title,
  the scope name as meta), `Skeleton` (loading), `Alert` (error), `Button` (Allow as primary with `busy`, Deny),
  `SkipLink`.
- Local: auth layout (`shared/auth-layout`). The screen sits outside the shell, like sign-in for an app. Allow
  and Deny post the consent form back to `/connect/authorize` with the antiforgery token; the page only reads
  the request and renders. new-scopes (journey 23) lists only the scopes not yet approved and says what was
  approved before.

### Signed out — `/signed-out` (`pages/signed-out`: signing-out, done)

- Library: `Card`, `Logo`, `Spinner` (signing-out), `List` with `ListItem` on a `surface` (done: one row per app
  signed out), `Button` (Sign in again, as a link), `SkipLink`.
- Local: auth layout (`shared/auth-layout`), and one hidden `iframe` per app's front-channel sign-out address
  while signing out. The screen sits outside the shell: the session has already ended. When an app started the
  sign-out, done continues to the app's return address instead of showing Sign in again.

## Dialogs

All dialogs open through Angular CDK `Dialog` with `modalDialogConfig` and render inside `DialogShell`.

| Dialog (mock folder: states)                                           | Library components                                                          | Local UI         |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------- |
| Add app (`dialogs/add-app`: default, busy, invalid, failed, duplicate) | `DialogShell`, `Button` (`busy`), `Alert` (failed; `warning` for duplicate) | App form         |
| Register an app (`dialogs/register-app`: default, invalid, busy, error, edit, edit-busy) | `DialogShell`, `ErrorSummary`, `FormField`, `Input` (text, and `textarea` for the address lists, one per line), `FieldSet` + `Choice` + `Check` (APIs and staying signed in as checkboxes, type as radios), `Alert` (error), `Button` (`busy`). Edit mode (journey 21) fills the values, shows the type as text, and saves with Save changes. A Consent `Check` (journey 23) marks the app first-party | — |
| Edit your profile (`dialogs/edit-profile`: default, invalid, busy, error) | `DialogShell`, `ErrorSummary`, `FormField`, `Input` (display name, optional), `Alert` (error), `Button` (Save changes, `busy`) | Email shown as text |
| Rotate secret (`dialogs/rotate-secret`: default, busy, error) | `DialogShell`, `Alert` (error), `Button` (`appearance="danger"`, `busy`) | — |
| Delete app — registered app (`dialogs/delete-client`: default, busy, error) | `DialogShell`, `FormField`, `Input` (type the name to confirm), `Alert` (error), `Button` (`appearance="danger"`, `busy`, disabled until the name matches) | — |
| Client secret (`dialogs/client-secret`: default, copied, rotated) | `DialogShell`, `Alert` (`warning`), `FormField`, `Input` (`readonly`, monospace), `Button` (Copy / Copied, Done) | Copy row (`Input` and `Button` side by side); polite status region for “copied” |
| Edit app (`dialogs/edit-app`: default, busy, invalid, failed)          | `DialogShell`, `Button`, `Alert` (failed, delete confirmation)              | App form         |
| Delete app (`dialogs/delete-app`: default, busy, failed)               | `DialogShell`, `AppIcon`, `Button` (`appearance="danger"`), `Alert`         | Tile preview row |
| Reset layout (`dialogs/reset-layout`: default, busy, failed)                   | `DialogShell`, `Button`, `Alert` (failed)                                   | —                |
| Sign out (`dialogs/sign-out`: default, busy, failed)                   | `DialogShell`, `Button` (`busy`), `Alert` (failed); copy says connected apps are signed out too (journey 18) | —                |

## Notifications

| Notification (mock folder: states)                                                          | Library components                     | Local UI |
| ------------------------------------------------------------------------------------------- | -------------------------------------- | -------- |
| App toast (`notifications/app-toast`: info, success, warning, danger, with-action, stacked) | `ToastService`, `ToastRegion`, `Toast` | —        |
| Status banner (`notifications/status-banner`: warning, success, persistent)                 | `Alert` with `banner`, `dismissible`   | —        |

## Summary of local UI to build

1. Page intro (greeting and summary line).
2. Auth layout for sign-in and reset-password.
3. App form, shared by add-app and edit-app.
4. Directory category sections.
5. Delete dialog tile preview row.
6. Brand guide swatches and logo specimens.
7. Settings card header row (title, lead and button), shared by Profile and Apps.
