# 0018 The consent page is a web app page that resumes the authorize request

- Status: accepted (journey 23, advance confirmation from `docs/prompts/23-approve-what-an-app-can-see.md`)

## Context

OpenIddict leaves consent to the host. Its samples render a server-side form that posts the authorize
parameters back to `/connect/authorize`. ingresso has no server-rendered pages: sign-in, verify-email and
authorize-error are Angular pages, and its CSRF protection (L2-034) is a cookie-to-header token that only
script can send. OpenIddict also has a per-app consent type, and every app so far was registered `implicit`.

## Decision

- When consent is needed, the authorize endpoint redirects to `/consent` with the authorize query unchanged.
- The page reads what to ask from `GET /api/consent?client_id=…&scope=…` (cookie session).
- **Allow** posts `POST /api/consent` with the anti-forgery header. That records a permanent OpenIddict
  authorization, then the page sends the browser back to `/connect/authorize` with the same query. The
  authorize endpoint finds the authorization, attaches it to the tokens and issues the code.
- **Deny** sends the browser back to `/connect/authorize` with the same query plus `consent=deny`. The
  authorize endpoint answers `access_denied` through OpenIddict, so the redirect address and `state` are
  checked as for any authorize response. Deny records nothing, so it needs no anti-forgery token: anyone could
  already send a person to an app's callback with `error=access_denied`.
- **First-party** is OpenIddict's consent type: `implicit` is first-party, `explicit` asks. New apps are
  `explicit` unless the administrator ticks the option.

## Consequences

- No new server-rendered view, and the page uses the same auth layout and components as sign-in for an app.
- Apps registered before journey 23 stay `implicit`, so they stay trusted until an administrator unticks the
  option in the edit dialog. The seeded sample app is created `explicit`, so a new database shows the page.
- Approvals are ordinary OpenIddict authorizations, so journey 24 can list and revoke them, and revoking one
  revokes its tokens.
