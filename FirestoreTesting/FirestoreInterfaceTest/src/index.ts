const admin = require('firebase-admin')

let credentialsLocation = "../heartschat-prod-creds.json"

let credentials = require(credentialsLocation)

admin.initializeApp({
  credential: admin.credential.cert(credentials)
})

const db=admin.firestore()

const testingCollection=db.collection("testing-1")

async function test1() {
  let doc = testingCollection.doc("Cyrus' Test Doc")

  console.log((await doc.get()).data())

  await doc.set(
    {
      TestField: "TestWritten",
      OtherField: "OtherWritten"
    }
  )

  console.log((await doc.get()).data())
}

test1()
