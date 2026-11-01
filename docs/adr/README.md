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
