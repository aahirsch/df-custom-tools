
import admin from 'firebase-admin';

import fetch from "node-fetch"

import fs from "fs"

const credentials = JSON.parse(fs.readFileSync("./heartschat-prod-creds.json","utf-8"))


admin.initializeApp({
  credential: admin.credential.cert(credentials)
})

const myToken="Bearer ya29.c.b0Aa9VdylkIEL9AJ2tdnubnSQqr6DXKv4gpBBh9WMms1bXVvgLZ6BbneqdDWxTKFNAS5wz0pvEUWkL2jFwWiGs4SlGp_KTc503ALyeRA5gahhNdeVy1NJZXiY5LcZa45tcHdQG1sbFCyNweLYowoKgs_wakZvoNOZ8-jorTkhBl9PJZoCgPZ16txINEmgS8Xa-PVl4xhipdr41IJbaa4b9SXb4cSEgu2kGE_I"

//https://cloud.google.com/monitoring/api/resources#tag_filestore_instance
//https://cloud.google.com/monitoring/api/metrics_gcp#gcp-firestore

async function testGetMetrics() {
  const readsQuery='{"query": "fetch firestore_instance::firestore.googleapis.com/document/read_count | delta 10h "}'
  const writesQuery=" fetch firebase_instance::firestore.googleapis.com/document/write_count"


  const response = await fetch("https://monitoring.googleapis.com/v3/projects/heartschat-prod-a505/timeSeries:query", {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      Authorization:myToken
    },
    body: readsQuery  
  })
  const data:any = await response.json()
  
  console.log(data)

}

testGetMetrics()
/*
// Imports the Google Cloud client library
import monitoring, { MetricServiceClient } from "@google-cloud/monitoring"


// Creates a client
const client:MetricServiceClient = new monitoring.MetricServiceClient()


async function readTimeSeriesFields() {


  const request = {
    name: client.projectPath("heatschat-prod-a505"),
    filter: 'metric.type="firestore.googleapis.com/document/read_count"',
    interval: {
      startTime: {
        // Limit results to the last 500 minutes
        seconds: Date.now() / 1000 - 60 * 500,
      },
      endTime: {
        seconds: Date.now() / 1000,
      },
    },
    // Don't return time series data, instead just return information about
    // the metrics that match the filter
    view: 'HEADERS',
  };

  // Writes time series data
  console.log(await client.listTimeSeries(request as any))
  
  
}
readTimeSeriesFields();

*/