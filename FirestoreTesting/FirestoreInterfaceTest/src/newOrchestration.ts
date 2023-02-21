import {Firestore,DocumentData, CollectionReference, DocumentSnapshot, OrderByDirection, Timestamp} from "@google-cloud/firestore"
import { DatabaseInterface,Message, Survey, Conversation } from "./DatabaseInterface"
import { Logging } from "@google-cloud/logging";
import { ResponseMessage, LogResponse } from "./types";
import  {conversion} from "./individualConversion";
import { allAtOnce } from "./regularlyScheduledLogging";

import StructureC from "./StructureC"


declare var require: any

let credentialsLocation = "/Users/christophersebastian/Downloads/heartschat-prod-a505-firebase-adminsdk-dgjo6-35494c7d54.json"


import admin, { firestore } from 'firebase-admin'


import fs from "fs"
import { clear } from "console";

const credentials = JSON.parse(fs.readFileSync(credentialsLocation,"utf-8"))


admin.initializeApp({
  credential: admin.credential.cert(credentials)
})

const db: Firestore = admin.firestore()
db.settings({ ignoreUndefinedProperties: true })

let col: CollectionReference = db.collection("cloudTest");

let dateCol: CollectionReference = db.collection("lastRan");


async function wayBackTime() {
  let testingTime = new Date
  testingTime.setDate(testingTime.getDate() - 30)
  let y = firestore.Timestamp.fromDate(testingTime)

  await dateCol.doc('time').update({
    date: y
  }) 
}




async function run() {
  await wayBackTime()
  console.log("running")
  allAtOnce("heartschat-prod-a505",dateCol,col)
}

run()
