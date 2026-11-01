## 01-register-the-sample-app
Register an app for sign-in gets your own apps ready to sign people in with ingresso. You give the app a name and the exact address ingresso should send people back to, plus where to land after signing out. ingresso registers it and hands you its client ID.

## 02-list-registered-apps
Clients list shows every app you've registered, by name, with its client ID and the addresses it's allowed to use. That's the ID you'll put in the app's settings.

## 03-unsafe-address-refused
ingresso keeps those addresses safe. An address that doesn't use https, except on your own machine, is refused, and nothing is registered. So register once, copy the client ID, and your app is ready for sign-in.
