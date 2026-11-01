# ingresso mocks

Static HTML mocks for every page, dialog and notification of ingresso, in every state. Open [index.html](index.html) from disk to browse them; no server or network is needed.

- `?theme=dark` forces the dark theme (the mock bar also toggles it); `?chrome=0` hides the mock bar and notes.
- Design rules, logo and wordmark come from the Magic Patterns brand reference (<https://project-app-access-dashboard-293.magicpatterns.app>): vermilion `#CF3B20` (the doorway), ink `#17181C` (the door), warm canvas `#F5F4F0` (the room), hairline `#E3E0D8`; Geist 600 at -4.5% tracking for headings and the wordmark, Geist Mono only for addresses. Tokens and the component kit now live in the design system (`../design-system/tokens/tokens.css`, `../design-system/assets/components.css`); `assets/` keeps only the mock chrome, logos and favicon. Tile, app-icon and header BEM names mirror the Angular `ig-*` library.

## Cast and catalog

Reuse these in every mock. "Today" is Saturday 31 October 2026, mid-afternoon.

- **Person**: Maya Reyes (`MR`), maya@northwind.com, signed in to **Northwind** with SSO.
- **Apps (11)**, in dashboard order: Gmail `mail.google.com` (opened 8 minutes ago), Slack `northwind.slack.com` (3 minutes ago), Linear `linear.app` (52 minutes ago), then GitHub, Figma, Notion, Salesforce, Workday, Zoom, 1Password, Datadog. The first three show as large "recent" tiles.
- **Directory extras**: Asana, Jira, Miro, Sentry.

## Assumptions and open questions

- No `docs/specs/` or `docs/detailed-designs/` exist yet, so `requirements` are empty in the manifest. Add L2 IDs once the specs are written.
- Screen list is derived from the existing Angular routes (`/`, `/directory`, `**`) and dialogs (add-app, edit-app), plus the screens every product needs: sign in, reset password, settings, brand guide (linked from the footer), 403, 500, offline, delete and sign-out confirmations.
- Delete is reached from the Edit app dialog. Settings and sign-in are assumed, because the backend owns authentication; SSO is a button, not a separate flow.
- Edit layout is drag-and-drop with a keyboard path (Space to lift, arrows to move); confirm that is the intended interaction.
- Colours for app icons are user data, so they are tokens (`--app-color-*`) rather than brand colours.

## Commands

```sh
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write
python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks   # writes docs/mocks/.cache (not committed)
```

## Coverage

<!-- coverage:start -->

Legend: ✅ mock exists · ➖ not applicable (reason in manifest) · ❌ missing

### Pages

| Screen | default | loading | empty | error | no-results | search-results | editing | offline | editing-refused | editing-narrow | account-menu | invalid | submitting | sent | expired | used | link-invalid | rate-limited | for-app | for-app-sent | sending | success | sign-out | signing-out | done | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Dashboard (`dashboard`) | [✅](pages/dashboard/default.html) | [✅](pages/dashboard/loading.html) | [✅](pages/dashboard/empty.html) | [✅](pages/dashboard/error.html) | [✅](pages/dashboard/no-results.html) | [✅](pages/dashboard/search-results.html) | [✅](pages/dashboard/editing.html) | [✅](pages/dashboard/offline.html) | [✅](pages/dashboard/editing-refused.html) | [✅](pages/dashboard/editing-narrow.html) | [✅](pages/dashboard/account-menu.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Directory (`directory`) | [✅](pages/directory/default.html) | [✅](pages/directory/loading.html) | [✅](pages/directory/empty.html) | [✅](pages/directory/error.html) |  | [✅](pages/directory/search-results.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Sign in (`sign-in`) | [✅](pages/sign-in/default.html) | ➖ | ➖ | [✅](pages/sign-in/error.html) |  |  |  |  |  |  |  | [✅](pages/sign-in/invalid.html) | [✅](pages/sign-in/submitting.html) | [✅](pages/sign-in/sent.html) | [✅](pages/sign-in/expired.html) | [✅](pages/sign-in/used.html) | [✅](pages/sign-in/link-invalid.html) | [✅](pages/sign-in/rate-limited.html) | [✅](pages/sign-in/for-app.html) | [✅](pages/sign-in/for-app-sent.html) |  |  |  |  |  |  |
| Verify your email (`verify-email`) | [✅](pages/verify-email/default.html) | ➖ | ➖ | [✅](pages/verify-email/error.html) |  |  |  |  |  |  |  |  |  | [✅](pages/verify-email/sent.html) |  |  | [✅](pages/verify-email/link-invalid.html) | [✅](pages/verify-email/rate-limited.html) |  |  | [✅](pages/verify-email/sending.html) |  |  |  |  |  |
| Reset password (`reset-password`) | [✅](pages/reset-password/default.html) | ➖ | ➖ | [✅](pages/reset-password/error.html) |  |  |  |  |  |  |  | [✅](pages/reset-password/invalid.html) | [✅](pages/reset-password/submitting.html) |  |  |  |  |  |  |  |  | [✅](pages/reset-password/success.html) |  |  |  |  |
| Settings (`settings`) | [✅](pages/settings/default.html) | [✅](pages/settings/loading.html) | ➖ | [✅](pages/settings/error.html) |  |  |  |  |  |  |  | [✅](pages/settings/invalid.html) |  |  |  |  |  |  |  |  |  | [✅](pages/settings/success.html) |  |  |  |  |
| Brand guide (`brand`) | [✅](pages/brand/default.html) | [✅](pages/brand/loading.html) | ➖ | [✅](pages/brand/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Page not found (`not-found`) | [✅](pages/not-found/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Access denied (`forbidden`) | [✅](pages/forbidden/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Something went wrong (`server-error`) | [✅](pages/server-error/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| You’re offline (`offline`) | [✅](pages/offline/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Can’t sign in to this app (`authorize-error`) | [✅](pages/authorize-error/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/authorize-error/sign-out.html) |  |  |  |
| Signed out (`signed-out`) | ➖ | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/signed-out/signing-out.html) | [✅](pages/signed-out/done.html) |  |

### Dialogs

| Screen | default | busy | invalid | failed | duplicate | Requirements |
|---|---|---|---|---|---|---|
| Add app (`add-app`) | [✅](dialogs/add-app/default.html) | [✅](dialogs/add-app/busy.html) | [✅](dialogs/add-app/invalid.html) | [✅](dialogs/add-app/failed.html) | [✅](dialogs/add-app/duplicate.html) |  |
| Edit app (`edit-app`) | [✅](dialogs/edit-app/default.html) | [✅](dialogs/edit-app/busy.html) | [✅](dialogs/edit-app/invalid.html) | [✅](dialogs/edit-app/failed.html) |  |  |
| Delete app (`delete-app`) | [✅](dialogs/delete-app/default.html) | [✅](dialogs/delete-app/busy.html) | ➖ | [✅](dialogs/delete-app/failed.html) |  |  |
| Reset layout (`reset-layout`) | [✅](dialogs/reset-layout/default.html) | [✅](dialogs/reset-layout/busy.html) | ➖ | [✅](dialogs/reset-layout/failed.html) |  |  |
| Sign out (`sign-out`) | [✅](dialogs/sign-out/default.html) | [✅](dialogs/sign-out/busy.html) | ➖ | [✅](dialogs/sign-out/failed.html) |  |  |

### Notifications

| Screen | info | success | warning | danger | with-action | stacked | persistent | Requirements |
|---|---|---|---|---|---|---|---|---|
| App toast (`app-toast`) | [✅](notifications/app-toast/info.html) | [✅](notifications/app-toast/success.html) | [✅](notifications/app-toast/warning.html) | [✅](notifications/app-toast/danger.html) | [✅](notifications/app-toast/with-action.html) | [✅](notifications/app-toast/stacked.html) |  |  |
| Status banner (`status-banner`) | ➖ | [✅](notifications/status-banner/success.html) | [✅](notifications/status-banner/warning.html) | ➖ |  |  | [✅](notifications/status-banner/persistent.html) |  |

<!-- coverage:end -->
