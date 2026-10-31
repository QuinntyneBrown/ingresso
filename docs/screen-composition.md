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
| Header      | `SiteHeader`, `Logo`, `Search` (`/` shortcut), `Button` (Edit layout / Done, Add app), `Tooltip` (`placement="below"`, edit unavailable below 1024px), `Avatar`, `MenuTrigger` + `Menu` + `MenuItem` (account menu: Settings, Brand guide, Sign out) | —                |
| Footer      | `SiteFooter`                                                                                                                                                                                                                                         | Footer note copy |
| Toasts      | `ToastService`, `ToastRegion`, `Toast`                                                                                                                                                                                                               | —                |
| Site banner | `Alert` with `banner`                                                                                                                                                                                                                                | —                |

## Shared local components

| Item                                        | Used by                               | Notes                                                                                              |
| ------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Page intro (greeting `h1` and summary line) | dashboard, directory, settings, brand | Layout with `Stack`; text only                                                                     |
| Auth layout (centred `Card` with `Logo`)    | sign-in, reset-password               | Wraps `Card`; build once                                                                           |
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

### Sign in — `/sign-in` (`pages/sign-in`: default, invalid, submitting, error, sent, expired, used, link-invalid, rate-limited)

- Library: `Card`, `Logo`, `FormField`, `Input`, `ErrorSummary` (invalid), `Button` (`busy` while submitting;
  "Use a different email" in sent), `Alert` (`success` for sent; `warning` for expired, used and rate-limited;
  `danger` for link-invalid and error), `SkipLink`.
- Local: auth layout (`shared/auth-layout`). The screen sits outside the shell: no header, footer or session load.

### Reset password — `/reset-password` (`pages/reset-password`: default, invalid, submitting, success, error)

- Library: as sign-in, plus `Alert` (`success`).
- Local: auth layout.

### Settings — `/settings` (`pages/settings`: default, loading, invalid, success, error)

- Library: `Card` (one per section, `title`), `FormField`, `Input`, `Choice` + `Check` (theme), `Switch`,
  `ErrorSummary`, `Button`, `Link` (`variant="back"`), `Skeleton`, `Alert`.
- Local: page intro; form actions row (`Cluster`).

### Brand guide — `/brand` (`pages/brand`: default, loading, error)

- Library: `Card`, `Logo`, `List` (`catalog`), `Cluster`, `Stack`, `Link` (`variant="back"`), `Skeleton`,
  `Alert`.
- Local: colour swatches and logo specimens.

### Status pages — `/**`, `/forbidden`, `/error`, `/offline` (`pages/not-found`, `pages/forbidden`, `pages/server-error`, `pages/offline`: default)

- Library: `StatusPage`, `Button`, `Cluster`.
- Local: none.

## Dialogs

All dialogs open through Angular CDK `Dialog` with `modalDialogConfig` and render inside `DialogShell`.

| Dialog (mock folder: states)                                           | Library components                                                          | Local UI         |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------- |
| Add app (`dialogs/add-app`: default, busy, invalid, failed, duplicate) | `DialogShell`, `Button` (`busy`), `Alert` (failed; `warning` for duplicate) | App form         |
| Edit app (`dialogs/edit-app`: default, busy, invalid, failed)          | `DialogShell`, `Button`, `Alert` (failed, delete confirmation)              | App form         |
| Delete app (`dialogs/delete-app`: default, busy, failed)               | `DialogShell`, `AppIcon`, `Button` (`appearance="danger"`), `Alert`         | Tile preview row |
| Reset layout (`dialogs/reset-layout`: default, busy)                   | `DialogShell`, `Button`, `Alert` (failed)                                   | —                |
| Sign out (`dialogs/sign-out`: default, busy)                           | `DialogShell`, `Button`                                                     | —                |

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
7. Settings form actions row.
