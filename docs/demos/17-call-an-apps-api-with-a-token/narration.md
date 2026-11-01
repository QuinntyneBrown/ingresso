## 01-register-apis-and-scopes
Call an app's API with a token lets the apps you publish call their own APIs on behalf of the person who signed in. First, tell ingresso about each API: give it a name, the audience its tokens will carry, and the scopes apps can ask for. Here you add a Notes API next to the Sample API that's already there.

## 02-the-app-calls-its-api
Now sign in to the sample app with ingresso. Along with signing you in, ingresso gives the app a short-lived access token for its API. The app calls its API with that token, and the API checks it with ingresso's public keys and answers with who you are.

## 03-another-apis-token-refused
And a token meant for a different API doesn't work. This one was issued to the Notes app for the Notes API, so the sample API turns it away. So register your APIs once, allow each app the scopes it needs, and every call carries proof of who's asking.
