# 0016 Administrators are a role on the account, granted from the CLI

- Status: accepted (journey 19, advance confirmation from `docs/prompts/19-register-an-app-from-the-dashboard.md`)

## Context

Registering the apps that sign in with ingresso must be limited to the people who run it (L2-103, L2-104).
Accounts already have a `Role` (`Member`, `Admin`) that nothing used, and the cookie carries it as a claim from
the moment of sign-in. ingresso has no user-management screens, and the person who installs it already has the
CLI.

## Decision

- An administrator is an account whose `User.Role` is `Admin`. There are no other roles and no permissions table.
- Only the CLI grants it: `users grant-admin --email <address>`. No API grants or removes it.
- The API checks it with an `Administrator` authorization policy whose handler reads the account's role from the
  database on each request, not the role claim in the cookie, so a grant applies at once and a role removed in
  the database stops working at once.
- `/api/auth/me` already returns the role; the web app shows administrator-only UI when it is `admin`. The UI is a
  convenience; the API policy is the control.

## Consequences

- One database lookup per administrator request, by primary key.
- Removing an administrator is a database change for now; a `users revoke-admin` command can follow when needed.
- Finer-grained permissions (for example, separate app owners) would need a new decision.
