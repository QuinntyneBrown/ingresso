# 0015 Apps are signed out by front-channel logout

- Status: accepted (journey 18, advance confirmation from `docs/prompts/18-sign-out-everywhere.md`)

## Context

Signing out of ingresso, or of one app, must end every app session that came from the ingresso session
(L2-100, L2-101). OpenID Connect offers two ways to tell apps: **front-channel logout**, where the browser loads
each app's logout address in a hidden frame, and **back-channel logout**, where the server posts a signed logout
token to each app. OpenIddict implements neither notification, only the end-session endpoint.

## Decision

Use **front-channel logout**. Each client may register one `--front-channel-logout-uri`. ingresso records which
clients signed in under each session (`SessionApp`), and its ID tokens carry the session's id as `sid`. On sign-out
the web app's signed-out page loads each recorded app's address with `iss` and `sid` in a hidden frame, waits for
the frames (5 seconds at most), and then lists the apps or continues to the app's return address.

The list of apps and the return address travel to the page in a time-limited (10 minutes) Data Protection ticket,
so the page never frames an address a link supplied.

## Consequences

- No outbound HTTP from the API, no logout tokens to sign, and no queue or retries.
- Apps must accept their session cookie in a frame: same-site apps work as they are; an app on another site must
  set its session cookie `SameSite=None; Secure`, and browsers that block third-party cookies stop front-channel
  logout for it. Back-channel logout, which has no such limit, is deferred.
- The web host's Content-Security-Policy must allow framing the apps' origins (`frame-src`); the API's own policy
  is unchanged because it serves no pages.
