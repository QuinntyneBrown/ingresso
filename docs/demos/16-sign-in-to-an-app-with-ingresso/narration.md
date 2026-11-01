## 01-the-sample-app
Sign in to an app with ingresso lets the apps you publish use your ingresso account, instead of building their own sign-in. Here's a sample app. It has one button: Sign in with ingresso.

## 02-ingresso-names-the-app
The app sends you to ingresso. You're not signed in yet, so ingresso asks for your email, and it says which app you're signing in to. The name comes from ingresso's own list of registered apps, so a crafted link can't put its own words here.

## 03-check-your-inbox
ingresso emails a sign-in link, and tells you that opening it takes you back to Sample app.

## 04-the-email-link
The link works once and expires in fifteen minutes. Open it.

## 05-signed-in-to-the-app
You're back in Sample app, signed in as you. The app got a signed ID token with your email, and it never saw a password.

## 06-straight-back-in
Next time is even quicker. You already have an ingresso session, so Sign in with ingresso goes straight back to the app, without showing an ingresso screen at all.
