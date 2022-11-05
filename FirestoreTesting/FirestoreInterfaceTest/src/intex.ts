import { Firestore } from "@google-cloud/firestore"

import admin from 'firebase-admin';

let credentialsLocation = "../heartschat-prod-creds.json"

const myToken="j "

//https://cloud.google.com/monitoring/api/resources#tag_filestore_instance
//https://cloud.google.com/monitoring/api/metrics_gcp#gcp-firestore

async function testGetMetrics() {
  const readsQuery=" fetch firebase_instance::firestore.googleapis.com/document/read_count"
  const writesQuery=" fetch firebase_instance::firestore.googleapis.com/document/write_count"


  const response = await fetch("https://monitoring.googleapis.com/v3/projects/$heartschat-prod-a505/timeSeries:query", {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "Authorization":myToken
    },
    body: JSON.stringify({
      "query": readsQuery
    }),
  })
  
  console.log(response)
}

testGetMetrics()