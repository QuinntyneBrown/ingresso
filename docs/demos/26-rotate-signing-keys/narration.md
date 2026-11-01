# Rotate signing keys

## 01-the-signing-keys

Rotate signing keys lets you change the key ingresso signs every token with, without signing anyone out. Start in the terminal: keys list shows the key in use today, marked active, and when it was made. The key itself lives in the database, locked with encryption, never in the clear.

## 02-rotate-and-publish-both-keys

Run keys rotate, and a fresh key takes over. Within moments ingresso signs new tokens with it, and the old key steps back to retiring. ingresso keeps publishing both, so apps can still check every token the old key signed, until the last of them has expired two weeks from now.

## 03-the-app-keeps-working

Meanwhile, the sample app you signed in to before the change carries on. It quietly renews its token, now signed with the new key, and its own API still answers. Nobody had to sign in again. That's key rotation: a new key whenever you want one, and every app keeps working.
