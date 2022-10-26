"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getFirestore(baseCollection) {
    const admin = require('firebase-admin');
    let credentialsLocation = "../heartschat-prod-creds.json";
    let credentials = require(credentialsLocation);
    admin.initializeApp({
        credential: admin.credential.cert(credentials)
    });
    const db = admin.firestore();
    return db.collection(baseCollection);
}
exports.default = getFirestore;
