import {Firestore,DocumentData} from "@google-cloud/firestore"

import { Conversation, DatabaseInterface,Message, Survey } from "./DatabaseInterface"

import StructureA from "./StructureA"
import StructureB from "./StructureB"
import StructureC from "./StructureC"


const admin = require('firebase-admin')

let credentialsLocation = "../heartschat-prod-creds.json"

let credentials = require(credentialsLocation)

admin.initializeApp({
  credential: admin.credential.cert(credentials)
})

const db:Firestore=admin.firestore()

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

async function test2() {
  
  const testingCollection = db.collection("testing-1")

  const badDoc = testingCollection.doc("doc that's not there")

  console.log(badDoc)

  console.log(await badDoc.get())

  console.log(await testingCollection.doc("Cyrus' Test Doc"))

  console.log(await testingCollection.listDocuments())
}

let testMessage:Message = {
  surveyId: "testSurveyId",
  agentId: "testAgentId",
  responseId: "testResponseId",
  input: "testInput",
  output: "testOutput",
  parameters: {
    testParam: "testParamValue",
    testParam2: "testParamValue2"
  },
  timestamp: "testTimestamp"
}

async function test3() {

  const testingCollection = db.collection("testing-1")

  await testingCollection.doc("newdoc").collection("F_records").add(testMessage)
  
}

async function test4() {
  const testingCollection = db.collection("testing-1")

  const q = testingCollection.where("TestField", "==", "1").limit(1)

  const result= await q.get()

  result.forEach((doc) => {
    console.log(doc.data())
  })

}

async function testUploadConversation(structure: DatabaseInterface,topLevelCollection: string) {
  const testingCollection = db.collection(topLevelCollection)

  const testConversation:Conversation = {
    surveyId: "testSurveyId",
    agentId: "testAgentId",
    responseId: "testResponseId",
    messages: [
      {
        input: "testInput1",
        output: "testOutput1",
        parameters: {
          testParam: "testParamValue",
          testParam2: "testParamValue2"
        },
        timestamp: "6/24/2022 4:03"
      } as Message,
      {
        input: "testInput2",
        output: "testOutput2",
        parameters: {
          testParam: "testParamValue",
          testParam2: "testParamValue2"
        },
        timestamp:"6/24/2022 4:03"
      } as Message
    ] }

  await structure.insertConversation(testingCollection,testConversation)

}

async function testUploadMessage(structure: DatabaseInterface,topLevelCollection: string) {
  const testingCollection = db.collection(topLevelCollection)

  const testMessage:Message = {
    surveyId: "testSurveyId",
    agentId: "testAgentId",
    responseId: "testResponseId",
    input: "testInput",
    output: "testOutput",
    parameters: {
      testParam: "testParamValue",
      testParam2: "testParamValue2"
    },
    timestamp: "6/24/2022 4:03"
  }

  await structure.insertMessage(testingCollection,testMessage)

}



//testUploadConversation(StructureA,"testing-A")

//testUploadConversation(StructureB,"testing-B")

//testUploadConversation(StructureC,"testing-C")

//testUploadMessage(StructureA,"testing-A")

//testUploadMessage(StructureB,"testing-B")

testUploadMessage(StructureC,"testing-C")