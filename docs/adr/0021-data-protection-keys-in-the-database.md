# 0021 Data Protection keys live in the database, protected by a certificate in production

- Status: accepted (journey 26, advance confirmation from `docs/prompts/26-rotate-signing-keys.md`)

## Context

Signing keys are stored encrypted with ASP.NET Core Data Protection (L2-139). The CLI writes them (`keys rotate`)
and the API reads them, so both processes must share one Data Protection key ring. By default each process keeps
its ring in the user profile, which differs between machines and containers.

## Decision

- Both the API and the CLI persist the Data Protection key ring in the ingresso database
  (`PersistKeysToDbContext<AppDbContext>`, table `DataProtectionKeys`), with the application name `ingresso`.
- Outside Development and Testing, the ring is protected with the certificate at
  `DataProtection:Certificate:Path` (and `:Password`), and the API and CLI refuse to start without it.
- Development and Testing keep the ring unencrypted in their local databases.

## Consequences

- A copy of the database alone doesn't reveal the signing keys in production; the certificate is needed too.
- Losing the certificate makes the stored signing keys unreadable; rotate after restoring a new one
  (`keys rotate` creates a key under the new ring).
- Hardware security modules and cloud key vaults are deferred.
