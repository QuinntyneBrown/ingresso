## 01-an-apps-actions
Manage registered apps lets an administrator look after the apps that sign in with ingresso, right from Settings. Each app in the list has its own actions: edit it, rotate its secret, disable it, or delete it.

## 02-edit-an-app
Edit opens the same form used to register the app, already filled in. Here Budget gets a second redirect address and is allowed to stay signed in with refresh tokens. Its type can't change, so it's shown as text. The same rules as registering apply.

## 03-rotate-the-secret
If a confidential app's secret might have leaked, rotate it. ingresso asks first, because the current secret stops working the moment you confirm.

## 04-the-new-secret-shown-once
The new secret is shown once, with a Copy button, just like at registration. ingresso stores only a hash of it, so copy it into the app now.

## 05-disable-an-app
Disable stops an app straight away without losing its settings. The sample app now carries a Disabled badge, and Enable brings it back whenever you're ready.

## 06-its-sign-in-refused
While it's disabled, the sample app can't sign anyone in. Its sign-in lands on ingresso's error page, and its codes and refresh tokens are refused too.

## 07-delete-after-typing-its-name
Deleting is for good, so ingresso asks you to type the app's name first. Delete removes Budget along with every token it holds. Your apps, managed in one place.
