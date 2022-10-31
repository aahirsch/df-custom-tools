// imports
import {Firestore,DocumentData} from "@google-cloud/firestore"

import { DatabaseInterface,Message, Survey } from "./DatabaseInterface"

import {parser} from "./parser"



// intializing stuff
declare var require: any
const admin = require('firebase-admin')

let credentialsLocation = "../heartschat-prod-creds.json"

let credentials = require(credentialsLocation)

admin.initializeApp({
  credential: admin.credential.cert(credentials)
})

const db:Firestore=admin.firestore()


// get data
let data  = parser('/Users/christophersebastian/Downloads/negbot_testing_q_conv_merge_2022-06-24.xlsx - _merge (1).csv')

// test away
let snipit = data[0] 

async function test3() {

    const testingCollection = db.collection("testing-1")
  
    await testingCollection.doc("newdoc").collection("F_records").add(snipit)
    
}
test3()

