// imports
import {Firestore,DocumentData} from "@google-cloud/firestore"

import { DatabaseInterface,Message, Survey, Conversation } from "./DatabaseInterface"

import {parser} from "./parser"

import {conversion} from "./conversion"

import StructureA from "./StructureA"
import StructureB from "./StructureA"
import StructureC from "./StructureA"
import StructureD from "./StructureA"



// intializing stuff
declare var require: any
const admin = require('firebase-admin')

let credentialsLocation = "/Users/christophersebastian/Downloads/heartschat-prod-a505-firebase-adminsdk-dgjo6-35494c7d54.json"

let credentials = require(credentialsLocation)

admin.initializeApp({
  credential: admin.credential.cert(credentials)
})

const db:Firestore=admin.firestore()

// function wrappings for easy testing

async function massUpload(structure: DatabaseInterface, topLevelCollection: string, dataMessages: any[]){
  const testingCollection = db.collection(topLevelCollection);
  for (let i = 0; i<dataMessages.length; i++){
    await structure.insertMessage(testingCollection, data[i] as Message);
  }
}

async function massConvoUpload(structure: DatabaseInterface, topLevelCollection: string, dataMessages: any[]){
  const testingCollection = db.collection(topLevelCollection);
  let convos = conversion(dataMessages);
  for (let i = 0; i<convos.length; i++){
    await structure.insertConversation(testingCollection,convos[i]);
  }
}

async function retriveConvo(structure: DatabaseInterface, topLevelCollection: string, sID: string, aID: string, rID: string){
  const testingCollection = db.collection(topLevelCollection);
  await structure.retrieveConversation(testingCollection,sID,aID,rID);
}

async function retriveSurvey(structure: DatabaseInterface, topLevelCollection: string, sID: string){
  const testingCollection = db.collection(topLevelCollection);
  await structure.retrieveSurvey(testingCollection,sID);
}

async function retAll(structure: DatabaseInterface, topLevelCollection: string){
  const testingCollection = db.collection(topLevelCollection);
  await structure.retrieveAll(testingCollection);
}

async function giveAc2Survey(structure: DatabaseInterface, topLevelCollection: string, reID: string, sIDs: string[]){
  const testingCollection = db.collection(topLevelCollection);
  await structure.giveAccessToSurveys(testingCollection, reID, sIDs);
}

async function getAcSurveys(structure: DatabaseInterface, topLevelCollection: string, reID: string){
  const testingCollection = db.collection(topLevelCollection);
  await structure.getAccessibleSurveys(testingCollection, reID);
}

async function getConvoBetween(structure: DatabaseInterface, topLevelCollection: string, start: Date, end: Date){
  const testingCollection = db.collection(topLevelCollection);
  await structure.getConversationsBetween(testingCollection, start, end);
}



// get data
let data  = parser('dataCSV.xlsx - _merge.csv');

// call tests
massUpload(StructureA,"testing-A",data);
massConvoUpload(StructureA,"testing-A",data);
retriveConvo(StructureA,"testing-A",data[0].surveyId,data[0].agentId,data[0].responseId);
retriveSurvey(StructureA,"testing-A",data[0].surveyId);
retAll(StructureA,"testing-A");
giveAc2Survey(StructureA,"testing-A","Zuckerberg",[data[0].surveyId]);
getAcSurveys(StructureA,"testing-A", "Zuckerberg");
getConvoBetween(StructureA,"testing-A", data[0].timestamp,data[50].timestamp);




