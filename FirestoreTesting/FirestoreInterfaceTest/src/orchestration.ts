import {Firestore,DocumentData, CollectionReference, DocumentSnapshot} from "@google-cloud/firestore"
import { DatabaseInterface,Message, Survey, Conversation } from "./DatabaseInterface"

import {parser} from "./parser"

import metricWrapper from "./Monitoring"

import {conversion} from "./conversion"

import StructureA from "./StructureA"
import StructureB from "./StructureB"
import StructureC from "./StructureC"
import StructureD from "./StructureD"


//Time waited before running the tests to ensure the accuracy of metrics
const timeBuffer = 4*60*1000 //ms

// initializing stuff
declare var require: any

let credentialsLocation = "./heartschat-prod-creds.json"


import admin from 'firebase-admin'


import fs from "fs"

const credentials = JSON.parse(fs.readFileSync(credentialsLocation,"utf-8"))


admin.initializeApp({
  credential: admin.credential.cert(credentials)
})

const db:Firestore=admin.firestore()

//a function to set up a unique collection for each test to ensure that tests don't collide
async function setUpWriteTest(name:string,topLevelCollection:string):Promise<CollectionReference<DocumentData>>{
  const topLevelCollectionReference:CollectionReference = db.collection(topLevelCollection)
  const testDocument = await topLevelCollectionReference.add({
    "InitialTestName":name,
    "at":new Date(),
    "FurtherTests":[]
  })
  return testDocument.collection("testingCollection")
}

async function setUpReadTest(name:string,testingCollection:CollectionReference<DocumentData>):Promise<void>{
  const parent:DocumentSnapshot|undefined = await testingCollection.parent?.get()
  if (parent===undefined){
    throw new Error("Invalid testing collection for a reading test")
  }
  else{
    await parent.ref.update({
      "FurtherTests":parent.data()?.FurtherTests.concat([{"name":name,"at":new Date()}])
    })
  }

}

//sets delay, logs metrics to console and times the function
async function runTest(name:string,test:()=>Promise<any>):Promise<void> {
  await new Promise(resolve => setTimeout(resolve, timeBuffer));
  console.log(`Starting test ${name}`)
  const startTime = new Date()
  const billingData=await metricWrapper(test)
  const endTime = new Date()
  console.log("Test started at: " + startTime)
  console.log("Test ended at: " + endTime)
  console.log(`Time Taken :${billingData[0]}ms`)
  console.log(`lookupReads :${billingData[1]}`)
  console.log(`queryReads :${billingData[2]}`)
  console.log(`updateWrites :${billingData[3]}`)
  console.log(`createWrites :${billingData[4]}`)
}

// function wrappings for easy testing

async function massUpload(structure: DatabaseInterface,structureName:string, topLevelCollection: string, dataMessages: any[]):Promise<CollectionReference<DocumentData>>{

  const testName=`massUpload-${structureName}`
  
  const testingCollection:CollectionReference<DocumentData> = await setUpWriteTest(testName,topLevelCollection)

  await runTest(testName,async ()=>{
    for (let i = 0; i<dataMessages.length; i++){
      await structure.insertMessage(testingCollection, dataMessages[i] as Message)
      //console.log('successful upload ' + i);
    }
  })

  return testingCollection
}

async function massConvoUpload(structure: DatabaseInterface, structureName:string, topLevelCollection: string, dataMessages: any[]):Promise<CollectionReference<DocumentData>>{
  const testName=`massConvoUpload-${structureName}`

  const testingCollection:CollectionReference<DocumentData> = await setUpWriteTest(structureName,topLevelCollection) 

  await runTest(testName,async ()=>{
  const convos = conversion(dataMessages);
    for (let i = 0; i<convos.length; i++){
      await structure.insertConversation(testingCollection,convos[i])
      //console.log('conversations upload ' + i)
    }
  })

  return testingCollection
}

async function retrieveConvo(structure: DatabaseInterface, structureName:string, testingCollection:CollectionReference<DocumentData>, sID: string, aID: string, rID: string){

  const testName=`retrieveConvo-${structureName}`

  await setUpReadTest(testName,testingCollection)

  await runTest(testName,async ()=>{
    const result = await structure.retrieveConversation(testingCollection,sID,aID,rID)
    //console.log('The conversation is...')
    //console.log(result)
  })
}

async function retrieveSurvey(structure: DatabaseInterface, structureName:string, testingCollection:CollectionReference<DocumentData>, sID: string){
  const testName=`retrieveSurvey-${structureName}`

  await setUpReadTest(testName,testingCollection)

  await runTest(testName,async ()=>{
    const result = await structure.retrieveSurvey(testingCollection,sID);
    //console.log('The survey is...');
    //console.log(result);
  })

}

async function retAll(structure: DatabaseInterface, structureName:string, testingCollection:CollectionReference<DocumentData>){

  const testName=`retAll-${structureName}`

  await setUpReadTest(testName,testingCollection)

  await runTest(testName,async ()=>{
    const result = await structure.retrieveAll(testingCollection)
    //console.log('The conversations are...')
    // for(let i = 0; i < result.length; i++){
    //   console.log(result[i])
    // }
  })

}

async function giveAc2Survey(structure: DatabaseInterface, structureName:string,testingCollection:CollectionReference<DocumentData> , reID: string, sIDs: string[]){
  const testName=`giveAc2Survey-${structureName}`

  await setUpReadTest(testName,testingCollection)

  await runTest(testName,async ()=>{

    await structure.giveAccessToSurveys(testingCollection, reID, sIDs)
    //console.log('success');

  })
}

async function getAcSurveys(structure: DatabaseInterface,structureName:string, testingCollection:CollectionReference, reID: string){

  const testName=`getAcSurveys-${structureName}`

  await setUpReadTest(testName,testingCollection)

  await runTest(testName,async ()=>{

    const res = await structure.getAccessibleSurveys(testingCollection, reID)
    // console.log('The accessible surveys are...');
    // for(let i = 0; i < res.length; i++){
    //   console.log(res[i])
    // }

  })

}

async function getConvoBetween(structure: DatabaseInterface, structureName:string, testingCollection:CollectionReference, start: Date, end: Date){

  const testName=`getConvoBetween-${structureName}`

  await setUpReadTest(testName,testingCollection)

  await runTest(testName,async ()=>{

    const res= await structure.getConversationsBetween(testingCollection, start, end);
    // console.log('The conversations are...');
    // for(let i = 0; i < res.length; i++){
    //     console.log(res[i]);
    // }

  })
}



// get data
let data  = parser('C:/Users/japan/Documents/Projects/Negotiation Chatbot/df-custom-tools/dataCSV.xlsx - _merge.csv');

async function centralizedWrites(structure: DatabaseInterface, structureName:string, topLevelCollection: string) {
  const massUploadRef = await massUpload(structure,structureName,topLevelCollection,data);
  const massConvoUploadRef = await massConvoUpload(structure,structureName,topLevelCollection,data);
  await retrieveConvo(structure,structureName,massUploadRef, data[0].surveyId as string, data[0].agentId as string, data[0].responseId as string)
  await retrieveSurvey(structure,structureName,massUploadRef,data[0].surveyId as string)
  await retAll(structure,structureName,massUploadRef)
  await giveAc2Survey(structure,structureName,massUploadRef,"Zuckerberg",[data[0].surveyId] as string[])
  await getAcSurveys(structure,structureName, massUploadRef, "Zuckerberg")
  //await getConvoBetween(structure,structureName, massUploadRef, new Date(data[0].timestamp as string), new Date(data[1].timestamp as string));
}


//call tests

async function testAll() {
  //await centralizedWrites(StructureA, "StructureA", "testingTrials")
  await centralizedWrites(StructureB, "StructureB", "testingTrials")
  await centralizedWrites(StructureC, "StructureC", "testingTrials")
  await centralizedWrites(StructureD, "StructureD", "testingTrials")
}

testAll()