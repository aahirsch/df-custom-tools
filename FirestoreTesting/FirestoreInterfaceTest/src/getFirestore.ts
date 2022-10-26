import {Firestore, CollectionReference} from "@google-cloud/firestore"

export default function getFirestore(baseCollection: string): CollectionReference {
  const admin = require('firebase-admin')

  let credentialsLocation = "../heartschat-prod-creds.json"

  let credentials = require(credentialsLocation)

  admin.initializeApp({
    credential: admin.credential.cert(credentials)
  })

  const db:Firestore=admin.firestore()

  return db.collection(baseCollection)

}