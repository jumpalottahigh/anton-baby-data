# anton-baby-data
Monitoring baby data: sleep, nursing, urination, tantrums

## Monitoring the vitals and activities of new borns is key to helping them grow healthy, and keeping the parent informed.

The "backend" of the app is currently hosted on Firebase. Implementation from less technical users is tricky at this point, but this is in the works to make the app easier to use and openly available to interested parents.

Right now, the way to use this is to fork it and host the static files. Make a free Firebase account, create an authenticated user, use the login button to login and then use the app.

Steps to get the project running:

-1 Fork and clone repo
-2 Deploy from heroku or just host static files (home.html and app.js)
-3 Create a Firebase account and make an app
-4 Add your app's URL to this line in app.js:
  ```javascript
  var firebaseDB = new Firebase('YOUR-URL-HERE');
  ```
-5 copy those rules to your Firebase app
  ```json
  {
    "rules": {
      ".write": "auth != null",
      ".read" : "auth !=null"
    }
  }
  ```
  This tells the app to only allow authorized users to view and edit data.
-6 Add yourself as a user in the "Login & Auth" section in Firebase
-7 Run the app, log in and add data. Data will be visible in realtime in Firebase.

## This is deployed in heroku and preview available at:
http://anton-data.herokuapp.com/
