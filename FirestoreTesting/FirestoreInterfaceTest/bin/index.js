"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase-admin/app");
let credentialsLocation = "../heartschat-prod-creds.json";
console.log(credentialsLocation);
let credentials = require(credentialsLocation);
console.log(credentials);
let myApp = (0, app_1.initializeApp)({
    credential: credentials,
    databaseURL: 'https://<DATABASE_NAME>.firebaseio.com'
});
