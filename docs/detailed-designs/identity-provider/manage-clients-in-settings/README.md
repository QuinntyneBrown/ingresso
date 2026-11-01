# Manage clients in Settings

## Overview

An administrator registers the apps that sign in with ingresso from **Settings → Apps** instead of the CLI. The
Apps card lists the registered apps. **Register an app** opens a dialog for the name, addresses, the APIs the app
may call and its type. A **public** app (a browser or device app) must use PKCE. A **confidential** app (a server
app) also gets a client secret, which ingresso stores hashed and shows once, in a client secret dialog with copy
buttons. People who are not administrators see no Apps card, and the API refuses them.

**administrator** — an account whose role is `Admin`, granted only by `users grant-admin` (ADR 0016)

**confidential client** — an OpenID Connect client that authenticates to the token endpoint with a secret

The CLI `clients` commands keep working and use the same Application handlers.

## Description

- **Role** — `User.Role` (`Member`, `Admin`) already exists, and `/api/auth/me` returns it.
  - `GrantAdministratorCommand(Email)` (`Ingresso.Application/Identity`) makes the account an administrator.
    It returns whether it already was one, and throws `NotFoundException` for an unknown email.
  - CLI: `users grant-admin --email <address>` (`UserCommands`).
- **Policy** — `AuthPolicies.Administrator` with `AdministratorRequirement` and `AdministratorHandler`
  (`Ingresso.Api/Auth`). The handler reads the signed-in account's role from the database by its id on each
  request, so a grant applies without signing in again (ADR 0016).
- **Clients API** (`ClientsController`, `[Authorize(Policy = Administrator)]`):
  - `GET /api/clients` returns the registered apps, sorted by name (`GetClientsQuery`, as `clients list` uses).
  - `POST /api/clients` takes `{ name, redirectUris, postLogoutRedirectUris, frontChannelLogoutUri, scopes,
    confidential }`. It returns `201 { client, clientSecret }`, where `clientSecret` is null for a public app.
    Validation problems are `400` with field errors, a duplicate name is `409`, and an unknown scope is `404`.
  - `GET /api/resources` (`ResourcesController`, same policy) returns the registered APIs and their scopes, for
    the dialog's checkboxes.
- **Registration** — `RegisterClientCommand` gains `Confidential`. For a confidential app the handler generates
  32 random bytes (`RandomNumberGenerator`), base64url-encoded, and passes them as `NewClient.ClientSecret`. It
  returns `RegisteredClientDto(ClientDto Client, string? ClientSecret)`.
  - `OpenIddictClientRegistry` creates the application with `ClientType = confidential` and the secret.
    OpenIddict stores only a hash of it.
  - `ClientDto` gains `Confidential`, read from the client type.
  - The validator's messages no longer name CLI options, so the CLI and the dialog show the same words.
- **Web app** (`projects/api`):
  - The `ClientsApi` contract, the `CLIENTS_API` token and `HttpClientsApi` cover `list()`, `register(input)`
    and `resources()`.
- **Web app** (`projects/ingresso`):
  - `SettingsPage` shows `AppsCard` when the current user's role is `admin`.
  - `AppsCard` (`pages/settings/apps-card.ts`) loads the list, with loading, empty, error and Try again states.
    Its Register an app button opens the dialog through `AppDialogs.openRegisterApp`.
  - `RegisterAppDialog` (`dialogs/register-app`) splits each textarea into addresses, one per line. It maps
    `400` field errors to its fields (`Name`, `RedirectUris…`, `PostLogoutRedirectUris…`,
    `FrontChannelLogoutUri`) and `409` to the name field, and shows an error alert for anything else.
    - For a public app, it closes with the result. The card reloads and a toast names the app.
    - For a confidential app, it closes and `ClientSecretDialog` opens.
  - `ClientSecretDialog` (`dialogs/client-secret`) shows the client ID and secret in read-only inputs, each with
    a Copy button (CDK `Clipboard`). A polite status announces the copy. The secret lives only in the dialog's
    data and is gone when the dialog closes.
- **Test seam** — `POST /api/test/sign-in` accepts `administrator: true`, so Playwright can act as an
  administrator.

## Behaviour as built

- Secrets never reach logs: request logging records method, path and status only (L2-038), and responses are
  not logged.
- A confidential app still uses PKCE; the secret is an extra check at the token endpoint.
- The list shows the type and client ID only. Addresses and scopes stay in the CLI's `clients list` until
  journey 21 adds editing.

## Requirements

The feature realizes the following level-2 (L2) requirements. Each L2 requirement refines a level-1 (L1) requirement, cited by identifier.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-103` | `L1-012`, `L1-008` | ingresso shall have administrators, and only the CLI shall make someone one. |
| `L2-104` | `L1-012`, `L1-008` | An administrator shall see the registered apps in Settings → Apps, and no one else shall. |
| `L2-105` | `L1-012` | An administrator shall register an app from a dialog, with the same rules as the CLI. |
| `L2-106` | `L1-012`, `L1-008` | An administrator shall register a confidential app, whose secret is stored hashed and shown once. |

It builds on `L2-087` and `L2-088` (registered apps and address rules), `L2-096` (scopes), `L2-099`
(front-channel address), `L2-033` (authentication) and `L2-038` (no secrets in logs).

## Diagrams

### System context

The administrator registers apps in ingresso. The apps later sign people in with it.

![C4 system context for manage clients in settings](diagrams/c4-context.png)

### Containers

The web app calls the clients API. The CLI grants the administrator role directly against the database.

![C4 container view for manage clients in settings](diagrams/c4-container.png)

### Components

![C4 component view for manage clients in settings](diagrams/c4-component.png)

### Class structure

![Class diagram for manage clients in settings](diagrams/class-structure.png)

### Behaviour — register a confidential app

![Sequence diagram: register a confidential app](diagrams/sequence-register.png)

## Open questions

- **Removing an administrator** is a database change until a `users revoke-admin` command is needed.
- **Editing, rotating secrets, disabling and deleting** apps are journey 21.
