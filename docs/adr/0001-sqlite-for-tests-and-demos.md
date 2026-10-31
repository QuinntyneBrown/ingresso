# 0001 SQLite for tests and demos

- Status: accepted (journey 00); amended in the scaffold run: SQLite applies the migrations

## Context

`AGENTS.md` requires that no test needs a database server and that Playwright runs against a seeded SQLite
database. The EF Core migrations target SQL Server, and SQLite cannot compare `DateTimeOffset` values.

## Decision

- `Database:Provider` selects `SqlServer` (default) or `Sqlite`; `ConnectionStrings:Default` is the
  connection string for either.
- The CLI `migrate` command applies the EF Core migrations on both providers. The migrations are generated
  against SQL Server and kept provider-neutral (no `nvarchar(max)`, so every string column is bounded), and the
  SQLite provider ignores `PendingModelChangesWarning` because its model differs only in provider
  annotations. Only the in-memory provider used by Application and CLI tests builds the schema from the model.
  `reset` drops, migrates and seeds.
- `AppDbContext` stores `DateTimeOffset` as sortable binary on SQLite only.
- `Clock:FixedUtcNow` fixes "today" (Monday, November 2, 2026 in tests, Playwright and demos).

## Consequences

SQL Server-only behaviour is covered by `[SqlServerFact]` tests that run when `INGRESSO_TEST_SQLSERVER` is set.
The README's SQL Server setup stays the production path; SQLite is for tests, Playwright and local demos.
