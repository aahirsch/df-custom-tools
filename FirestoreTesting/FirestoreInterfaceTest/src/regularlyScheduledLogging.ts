import {Firestore,DocumentData, CollectionReference, DocumentSnapshot} from "@google-cloud/firestore"
import { DatabaseInterface,Message, Survey, Conversation } from "./DatabaseInterface"
import { Logging } from "@google-cloud/logging";
import { ResponseMessage, LogResponse } from "./types";
import  {conversion} from "./individualConversion";


import StructureC from "./StructureC"


declare var require: any

let credentialsLocation = "./heartschat-prod-creds.json"


import admin from 'firebase-admin'


import fs from "fs"

const credentials = JSON.parse(fs.readFileSync(credentialsLocation,"utf-8"))


admin.initializeApp({
  credential: admin.credential.cert(credentials)
})

const db:Firestore=admin.firestore()


let col: CollectionReference = db.collection("testingCloudFunctions");

let lastRan: Date;
let tooCloseToUpload = new Map<String, LogResponse[]>();

function transformMessages(messages: ResponseMessage[]): string {
  return messages.map((message) => message?.text?.text?.join(" ")).join("\n");
}

export async function* readResponses(
  projectId: string,
  logging = new Logging({ projectId })
): AsyncIterable<LogResponse> {
  const start = lastRan;
  const end = new Date();

  const stream = logging.getEntriesStream({
    maxApiCalls: 20,
    autoPaginate: true,
    filter: `
      logName = "projects/${projectId}/logs/dialogflow-runtime.googleapis.com%2Frequests"
      timestamp >= "${start.toISOString()}"
      timestamp <= "${end.toISOString()}"
      jsonPayload.responseId=~".+"
    `,
  });

  for await (const { data, metadata } of stream) {
    yield {
      responseId: data.responseId ?? "",
      agentId: metadata.labels?.agent_id ?? "",
      sessionId: metadata.labels?.session_id ?? "",
      timestamp: metadata.timestamp?.toString() ?? "",
      request: data.queryResult?.text ?? "",
      response: transformMessages(data.queryResult?.responseMessages ?? []),
      parameters: data.queryResult?.parameters ?? {},
    };
  }
}

export async function allAtOnce(
  projectId: string, 
  logging = new Logging({ projectId })) {

  let map = new Map<String, LogResponse[]>();
  map = tooCloseToUpload;
  tooCloseToUpload.clear;

  const stream = readResponses("project id", logging as any)

  let time: Date = new Date()
  time.setMinutes(time.getMinutes() - 45)

  for await (const response of stream) {
    
    let temp = response.agentId;
    let stamp: Date = new Date(response.timestamp)

    if(stamp !<= time) {
      if(tooCloseToUpload.has(temp)) {
        tooCloseToUpload.get(temp)?.push(response)
      } else {
        tooCloseToUpload.set(temp, [response])
      }
    } else {
      if(tooCloseToUpload.has(temp)) {
        tooCloseToUpload.get(temp)?.push(response)
      } else if(map.has(temp)) {
        map.get(temp)?.push(response)
      } else {
        map.set(temp,[response])
      }
    }

    /*Logic:
    // First we take all the data that was in the last too close to upload
    // and we feed it to our current map. Then we empty the too close to upload.
    // This means that all the data that was too close to be uploaded in the last one
    // is now in ready to be uploaded.

    // Then we go through the new data. If the data is with the past 45 minutes
    // then we send it to the too close to upload. If the data is not within the
    // last 45 minutes then we do a check to find out of the id is within the 
    // too close to upload. IF it is, then it means that the data is in that weird
    // cut-off where half of it is on time but the other half isn't and it could
    // theoretically still be going on. 

    // So, if we encounter data that is okay on time, but has Id that is in the
    // too close to upload then we add that data, even though it's time is okay,
    // to the too close to upload. 

    // However, if it isn't present, that means we know for 100% that the conversation
    // is done and we can then add it conoversations to be uploaded map.
    */
  }

  for(let groupedResponses of map.values()) {
    let temp: Conversation = conversion(groupedResponses)
    await StructureC.insertConversation(col,temp)
  }

  lastRan = new Date()
}




  