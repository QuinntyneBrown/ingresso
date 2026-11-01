# Architecture decision records

Short records of choices the requirements and designs left open. One file per decision, numbered in order.
The first four were carried over from the stack ingresso is built on; references to journeys and `L2-` IDs in
them point at that stack's history and are revised as ingresso writes its own.

| ADR | Decision |
|-----|----------|
| [0001](0001-sqlite-for-tests-and-demos.md) | SQLite runs Playwright and demos; SQL Server stays the product database |
| [0005](0005-self-hosted-geist.md) | Geist and Geist Mono are self-hosted |
| [0006](0006-security-headers-and-csrf.md) | Security headers, HSTS and CSRF with ASP.NET Core Antiforgery |
| [0009](0009-server-side-sessions-behind-the-cookie.md) | Server-side sessions behind the data-protected cookie |
| [0010](0010-free-placement-dashboard-grid.md) | Free-placement dashboard grid ported from qbc-grid, with responsive collapse |
| [0011](0011-phone-header-and-sign-in-redirect.md) | The phone header keeps its actions; a 401 redirects to /sign-in |
| [0012](0012-tiles-do-not-show-a-category.md) | Tiles show name, host, description and colour; category stays out of the tile |
| [0013](0013-theme-choice-is-kept-in-the-browser.md) | The theme choice is kept in this browser |
| [0014](0014-openiddict-is-the-openid-connect-server.md) | OpenIddict is the OpenID Connect server, with its stores in AppDbContext |
| [0015](0015-front-channel-logout.md) | Apps are signed out by front-channel logout, from the signed-out page |
| [0016](0016-administrators-are-a-role-on-the-account.md) | Administrators are a role on the account, granted from the CLI and checked against the database |
| [0017](0017-profile-is-edited-in-a-dialog.md) | The profile is shown in Settings and edited in a dialog |
| [0018](0018-consent-page-resumes-the-authorize-request.md) | The consent page is a web app page that resumes the authorize request |
| [0019](0019-last-used-is-the-latest-token-issued.md) | An app's "last used" is the latest token ingresso issued it |
| [0020](0020-coarse-device-description.md) | Sessions keep a coarse device description, not the user agent |
| [0021](0021-data-protection-keys-in-the-database.md) | Data Protection keys live in the database, protected by a certificate in production |
| [0022](0022-activity-events-separate-from-audit-entries.md) | Security activity is its own event store, not the audit entries |
