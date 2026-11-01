# 0014 OpenIddict is the OpenID Connect server

- Status: accepted (journey 15, advance confirmation from `docs/prompts/15-register-an-app-for-sign-in.md`)

## Context

L1-012 makes ingresso the OpenID Connect identity provider for the apps its owner publishes (journeys 15–27).
That needs client registration, the authorize, token, end-session, userinfo and revocation endpoints, signing
keys, refresh tokens, consent and revocation. Writing the protocol by hand is where security bugs live. The
choices are a hand-rolled server, Duende IdentityServer, or OpenIddict.

## Decision

Use **OpenIddict** 7 (Apache 2.0) as the OpenID Connect server, with its Entity Framework Core stores in
`AppDbContext` (`modelBuilder.UseOpenIddict()`), so clients, authorizations, scopes and tokens live in the
ingresso database and are created by the same migrations as everything else.

- Sign-in at an app reuses the ingresso cookie session (ADR 0009) through OpenIddict's pass-through mode: the
  authorize endpoint asks for the existing session and, without one, sends the person to the email-link
  sign-in.
- `Ingresso.Application` owns the rules (validation, uniqueness, output) behind an `IClientRegistry`
  contract. `Ingresso.Infrastructure` implements it with `IOpenIddictApplicationManager`, so the Application
  layer never references OpenIddict.
- Apps registered by the CLI are public clients that must use PKCE (S256). Confidential clients with secrets
  come with journey 19.

## Consequences

- No licence fees or revenue thresholds, unlike Duende IdentityServer.
- Protocol behaviour comes from a maintained, certified-in-practice library; ingresso tests the behaviour it
  configures, not the library's internals.
- OpenIddict's tables (`OpenIddictApplications`, `OpenIddictAuthorizations`, `OpenIddictScopes`,
  `OpenIddictTokens`) join the schema and the CLI `migrate` command.
- OpenIddict upgrades are a dependency to track; major versions can change its schema and need a migration.
