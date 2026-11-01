# Journeys


| #   | Name                               | Description                                                                              | Effort (days) |
| --- | ---------------------------------- | ---------------------------------------------------------------------------------------- | ------------- |
| 1   | Sign in with an email link         | Request a link, open it from email, land on a private dashboard.                         | 3             |
| 2   | Add an app by address              | Enter a name and web address; the tile takes the first free 3×2 space.                   | 2             |
| 3   | View the dashboard                 | See every tile in its saved position, with loading, empty and error states.              | 2             |
| 4   | Open an app                        | Click a tile; the app opens in a new tab and the visit is recorded.                      | 1.5           |
| 5   | Edit a tile                        | Change a tile's name, address, colour or category from the Edit dialog.                  | 1             |
| 6   | Delete a tile                      | Confirm deleting a named tile; it disappears and a toast confirms.                       | 1             |
| 7   | Quick jump to an app               | Press `/`, type part of a name, press Enter to open the match.                           | 2             |
| 8   | Arrange tiles                      | In edit mode, drag or use the keyboard to move and resize tiles; it saves.               | 3             |
| 9   | Add an app from the directory      | Browse common apps and add one through a pre-filled form.                                | 2             |
| 10  | See when apps were last opened     | Each tile shows when its app was last opened.                                            | 1             |
| 11  | Sign out                           | End the session on this device and return to sign-in.                                    | 0.5           |
| 12  | Verify an email address            | Open the verification link so the account can use its dashboard.                         | 1             |
| 13  | Reset the layout                   | Confirm a reset; tiles pack at 3×2 in the order they were created.                       | 0.5           |
| 14  | Switch theme                       | Choose light or dark; the choice persists across visits.                                 | 1             |
| 15  | Register an app for sign-in        | From the CLI, register a published app's name and redirect addresses; get its client ID. | 1.5           |
| 16  | Sign in to an app with ingresso    | Choose "Sign in with ingresso" in an app; return signed in, via an email link if needed. | 5             |
| 17  | Call an app's API with a token     | An app's API accepts ingresso access tokens issued for it and rejects all others.        | 2             |
| 18  | Sign out everywhere                | Signing out of ingresso or an app ends the ingresso session and every app's session.     | 2             |
| 19  | Register an app from the dashboard | In Settings, add an app from a dialog; its client secret is shown once.                  | 3             |
| 20  | Stay signed in to an app           | An app renews access silently with a refresh token until it is revoked or expires.       | 2             |
| 21  | Manage registered apps             | Edit an app's addresses, rotate its secret, disable it, or delete it.                    | 2             |
| 22  | Share profile details with apps    | Apps that ask for profile or email scopes receive the name and verified email.           | 1.5           |
| 23  | Approve what an app can see        | The first sign-in to an app that asks for more than sign-in shows a consent screen.      | 2             |
| 24  | Review and revoke app access       | List the apps you have approved and revoke one; its tokens stop working.                 | 1.5           |
| 25  | See and end other sessions         | List signed-in devices and end any of them, signing it out of every app.                 | 2             |
| 26  | Rotate signing keys                | A new signing key takes over; the old one is still published until its tokens expire.    | 1.5           |
| 27  | Review sign-in activity            | See a log of sign-ins, app approvals, token grants and revocations.                      | 2             |
|     | **Total**                          |                                                                                          | **49.5**      |

## Identity provider

Journeys 15 to 27 make ingresso the identity provider for the apps its owner publishes, over OpenID Connect
(authorization code with PKCE). Sign-in at an app reuses the ingresso session, so the email link and session
rules of journeys 1, 11 and 12 apply unchanged.

| Tier                             | Journeys | Outcome                                                                           | Effort (days) |
| -------------------------------- | -------- | --------------------------------------------------------------------------------- | ------------- |
| 1. Single sign-on for owned apps | 15 to 18 | Apps registered from the CLI sign users in, call their APIs, and sign out as one. | 10.5          |
| 2. A complete identity provider  | 19 to 27 | Apps are managed in the dashboard; refresh, consent, revocation, keys and audit.  | 17.5          |
