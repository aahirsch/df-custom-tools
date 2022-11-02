// imports
import {Firestore,DocumentData} from "@google-cloud/firestore"

import { DatabaseInterface,Message, Survey, Conversation } from "./DatabaseInterface"

import {parser} from "./parser"

import {conversion} from "./conversion"

import StructureA from "./StructureA"



// intializing stuff
declare var require: any
const admin = require('firebase-admin')

let credentialsLocation = "/Users/christophersebastian/Downloads/heartschat-prod-a505-firebase-adminsdk-dgjo6-35494c7d54.json"
//../heartschat-prod-creds.json
let credentials = require(credentialsLocation)

admin.initializeApp({
  credential: admin.credential.cert(credentials)
})

const db:Firestore=admin.firestore()


// get data
let data  = parser('/Users/christophersebastian/Downloads/negbot_testing_q_conv_merge_2022-06-24.xlsx - _merge (1).csv')
let snipit = data[0] ;
let snipit2 = data[0] as Message;
let endsnipit = data[10];
// test away
const testingCollection = db.collection("testing-2")

// have to make csv --> JSON into csv --> Message i think
async function testUploadMessage(structure: DatabaseInterface,topLevelCollection: string) {
  const testingCollection = db.collection(topLevelCollection)
  await structure.insertMessage(testingCollection, data[0] as Message)
}

testUploadMessage(StructureA,"testing-A")


// for(let i = 0; i < data.length; i++){
//   StructureA.insertMessage(testingCollection, data[i] as Message)
// }


// let conversations = conversion(data);
// for (let i = 0; i < conversations.length; i++){
//   StructureA.insertConversation(testingCollection, conversations[i])
// }



// StructureA.retrieveConversation(testingCollection,snipit.surveyId, snipit.agentId ,snipit.output) 

// StructureA.retrieveSurvey(testingCollection,snipit[0]) 

// StructureA.retrieveAll(testingCollection)

// StructureA.giveAccessToSurveys(testingCollection, "Mark", [snipit.surveId, endsnipit.SurveyId]) 

// StructureA.getAccessibleSurveys(testingCollection, "Mark") 

// StructureA.getConversationsBetween(testingCollection, snipit.timestamp, endsnipit.timestamp) 

