import {Firestore,DocumentData} from "@google-cloud/firestore"
import { DatabaseInterface,Message, Survey, Conversation } from "./DatabaseInterface.js"

import {parser} from "./parser.js"

import metricWrapper from "./Monitoring.js"

import {conversion} from "./conversion.js"

import StructureA from "./StructureA.js"
import StructureB from "./StructureB.js"
import StructureC from "./StructureC.js"
import StructureD from "./StructureD.js"





// intializing stuff
declare var require: any

let credentialsLocation = "/Users/christophersebastian/Downloads/heartschat-prod-a505-firebase-adminsdk-dgjo6-35494c7d54.json"


import admin from 'firebase-admin'


import fs from "fs"

const credentials = JSON.parse(fs.readFileSync(credentialsLocation,"utf-8"))


admin.initializeApp({
  credential: admin.credential.cert(credentials)
})

const db:Firestore=admin.firestore()

// function wrappings for easy testing

async function massUpload(structure: DatabaseInterface, topLevelCollection: string, dataMessages: any[]){
  const testingCollection = db.collection(topLevelCollection);
  for (let i = 0; i<5; i++){
    await structure.insertMessage(testingCollection, dataMessages[i] as Message)
    console.log('successful upload ' + i);
  }
}

async function massConvoUpload(structure: DatabaseInterface, topLevelCollection: string, dataMessages: any[]){
  const testingCollection = db.collection(topLevelCollection);
  let convos = conversion(dataMessages);
  for (let i = 0; i<5; i++){
    await structure.insertConversation(testingCollection,convos[i])
    console.log('conversations upload ' + i);
  }
}

async function retriveConvo(structure: DatabaseInterface, topLevelCollection: string, sID: string, aID: string, rID: string){
  const testingCollection = db.collection(topLevelCollection);
  const result = await structure.retrieveConversation(testingCollection,sID,aID,rID);
  console.log('The conversation is...');
  console.log(result);
}

async function retriveSurvey(structure: DatabaseInterface, topLevelCollection: string, sID: string){
  const testingCollection = db.collection(topLevelCollection);
  const result = await structure.retrieveSurvey(testingCollection,sID);
  console.log('The survey is...');
  console.log(result);

}

async function retAll(structure: DatabaseInterface, topLevelCollection: string){
  const testingCollection = db.collection(topLevelCollection);
  const result = await structure.retrieveAll(testingCollection)
    console.log('The conversations are...')
    for(let i = 0; i < result.length; i++){
      console.log(result[i])
    }

}

async function giveAc2Survey(structure: DatabaseInterface, topLevelCollection: string, reID: string, sIDs: string[]){
  const testingCollection = db.collection(topLevelCollection);
  await structure.giveAccessToSurveys(testingCollection, reID, sIDs)
  console.log('success');
}

async function getAcSurveys(structure: DatabaseInterface, topLevelCollection: string, reID: string){
  const testingCollection = db.collection(topLevelCollection);
  const res = await structure.getAccessibleSurveys(testingCollection, reID)
  console.log('The accessible surveys are...');
  for(let i = 0; i < res.length; i++){
    console.log(res[i])
  }

}

async function getConvoBetween(structure: DatabaseInterface, topLevelCollection: string, start: Date, end: Date){
  const testingCollection = db.collection(topLevelCollection);
  const res= await structure.getConversationsBetween(testingCollection, start, end);
  console.log('The conversations are...');
  for(let i = 0; i < res.length; i++){
      console.log(res[i]);
  }
}



// get data
let data  = parser('/Users/christophersebastian/df-custom/df-custom-tools/dataCSV.xlsx - _merge.csv');
  // massUpload(StructureA,"officalTest",data);
  // massConvoUpload(StructureA,"officalTest",data);
  // retriveConvo(StructureA,"officalTest", data[0].surveyId as string, data[0].agentId as string, data[0].responseId as string);
  // retriveSurvey(StructureA,"officalTest",data[0].surveyId as string);
  // retAll(StructureA,"officalTest");
  // giveAc2Survey(StructureA,"officalTest","Zuckerberg",[data[0].surveyId] as string[]);
  // getAcSurveys(StructureA,"officalTest", "Zuckerberg");
  // getConvoBetween(StructureA,"officalTest", new Date(data[0].timestamp as string), new Date(data[1].timestamp as string));

//call tests

async function centralizedWrites(structure: DatabaseInterface, topLevelCollection: string) {
  await massUpload(structure,topLevelCollection,data);
  await massConvoUpload(structure,topLevelCollection,data);
  await retriveConvo(structure,topLevelCollection, data[0].surveyId as string, data[0].agentId as string, data[0].responseId as string);
  await retriveSurvey(structure,topLevelCollection,data[0].surveyId as string);
  await retAll(structure,topLevelCollection);
  await giveAc2Survey(structure,topLevelCollection,"Zuckerberg",[data[0].surveyId] as string[]);
  await getAcSurveys(structure,topLevelCollection, "Zuckerberg");
  await getConvoBetween(structure,topLevelCollection, new Date(data[0].timestamp as string), new Date(data[1].timestamp as string));
}

centralizedWrites(StructureA, "officalTest");