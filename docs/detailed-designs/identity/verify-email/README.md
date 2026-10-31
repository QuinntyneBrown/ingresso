# Verify an email address

## Overview

A verified email address proves that the account holder controls the inbox. ingresso records each verified address once and gates tile access on it.

**verified email** — record that a normalized email address has proven inbox control, with the time of proof

Verification uses the same security-token mechanism as sign-in, with the `VerifyEmail` purpose. A user may request another verification email, subject to rate limits.

## Description

The slice runs from the ingresso web app to the ingresso database.

- **`AuthController.VerifyEmail`** — `GET /auth/verify-email?token=`. It sends `VerifyEmailCommand` and redirects to `/?email-verified=1` or `/?email-verified=0`.
- **`VerifyEmailCommandHandler`** — redeems a `VerifyEmail` token and adds a `VerifiedEmail` row when none exists for the address.
- **`ResendVerificationCommandHandler`** — issues a new `VerifyEmail` token and enqueues the email, unless the address is already verified.
- **`VerifiedEmail`** — entity keyed by `NormalizedEmail` with `VerifiedAtUtc`.

## Behaviour as built

- Redeeming a sign-in link writes a `VerifiedEmail` row (same unit of work as the session), so a first sign-in verifies the address.
- `TilesController` requires the `verified-email` policy (`VerifiedEmailHandler` looks the account's email up in `VerifiedEmail`); an unverified account gets `403`.
- `GET /api/auth/me` reports `emailVerified`; it stays available to unverified accounts so the app can route them.
- `POST /api/auth/verification-emails` (authorized, CSRF-checked) sends `ResendVerificationCommand`, answers `202` whether or not an email was sent, and is rate limited per account (`Auth:Verification:PerUserPerHour`, default 3; `429` with `Retry-After`).
- The test sign-in seam can create a new unverified account (`createUnverified`), so tests and demos can run the flow repeatedly.
- The web app sends an unverified account to `/verify-email` (outside the shell): a Send another email button, a Sign out button, and notices for sent, rate limited, failed and a link that did not work. Following the link lands on the dashboard with an "Email verified" toast.

## Requirements

The feature realizes the following level-2 (L2) requirements. Each L2 requirement refines a level-1 (L1) requirement, cited by identifier.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-029` | `L1-007` | A new account's email shall be verified before the dashboard opens. |

## Diagrams

### System context

The user verifies their address through ingresso, which sends the email through an external provider.

![C4 system context for verify an email address](diagrams/c4-context.png)

### Containers

`Ingresso.Api` issues the token and queues the email. The user opens the verification link on the API.

![C4 container view for verify an email address](diagrams/c4-container.png)

### Components

`AuthController` dispatches verification commands. The handlers read and write `SecurityToken` and `VerifiedEmail` rows.

![C4 component view for verify an email address](diagrams/c4-component.png)

### Class structure

`VerifyEmailCommandHandler` consumes a `SecurityToken` and creates a `VerifiedEmail`. `ResendVerificationCommandHandler` issues a new token.

![Class diagram for verify an email address](diagrams/class-structure.png)

### Behaviour — verify an email address

A usable token adds the `VerifiedEmail` row once. Every outcome redirects home with a flag that the web app turns into a toast.

![Sequence diagram: verify an email address](diagrams/sequence-verify.png)
