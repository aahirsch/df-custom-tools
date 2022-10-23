import {initializeApp} from "firebase-admin/app"

let credentialsLocation = "../heartschat-prod-creds.json"

let credentials = require(credentialsLocation)

console.log(credentials)


let myApp=initializeApp({
    credential: credentials,
    databaseURL: 'https://<DATABASE_NAME>.firebaseio.com'
});

