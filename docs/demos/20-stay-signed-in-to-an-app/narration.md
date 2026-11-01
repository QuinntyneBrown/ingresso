## 01-signed-in-and-calling-its-api
Stay signed in to an app keeps your apps working without sending you back to sign in. Here the sample app is signed in with ingresso and calling its own API with a short-lived access token. It also asked for a refresh token.

## 02-renewed-quietly
Time passes and the access token expires. The app trades its refresh token for a new one, quietly, and the call still works. Each refresh token works once, and reusing an old one shuts the whole chain down.

## 03-sign-in-again-after-the-session-ends
But the refresh token is tied to your ingresso session. Once that session ends, the next renewal is refused, and the app asks you to sign in again. Your apps stay signed in for as long as you are, and no longer.
