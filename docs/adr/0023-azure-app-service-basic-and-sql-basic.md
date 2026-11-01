# 0023 Deploy to Azure App Service Basic with Azure SQL Basic

- Status: accepted

## Context

ingresso is used by one or two people. It needs a production-grade host (always on, TLS, health checks, a real
database with backups) at the lowest price. The API owns authentication with cookies and `/auth/redeem` links, so
the web app and the API must share one origin.

## Decision

- **Compute:** Azure App Service on a Linux **Basic B1** plan (about USD 13 a month). Free and Shared tiers cannot
  stay always on or bind TLS to a custom domain, so B1 is the cheapest production tier.
- **Data:** Azure SQL Database **Basic** (5 DTU, 2 GB, about USD 5 a month). The app is SQL Server first (ADR 0010);
  SQLite on App Service storage is not safe for production.
- **One origin:** the API serves the Angular build from `wwwroot` (static files and an `index.html` fallback that
  never answers `/api`, `/connect`, `/.well-known` or `/health`), only when `wwwroot/index.html` exists.
- **Infrastructure as code:** `infra/main.bicep`. **Delivery:** `.github/workflows/deploy.yml` after CI passes on
  `main`: deploy infrastructure, build, run the CLI `migrate` against Azure SQL, then zip-deploy.
- **Secrets:** GitHub OIDC to Azure (no stored credential); the SQL password and the PKCS#12 certificate (identity
  provider encryption and Data Protection, ADR 0021) are GitHub secrets.

## Consequences

- About USD 18 a month in total. One instance only; scale up before scaling out.
- Basic DTU is slow under load, which is fine for one or two users.
- The SQL server accepts the Azure-services rule so the web app can connect; the workflow opens and closes a rule for
  its own runner to migrate.
- Outbound email has no production sender yet; sign-in emails need one before real use.
