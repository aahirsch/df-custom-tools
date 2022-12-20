import {Firestore,DocumentData, CollectionReference, DocumentSnapshot, OrderByDirection, Timestamp} from "@google-cloud/firestore"
import { DatabaseInterface,Message, Survey, Conversation } from "./DatabaseInterface"
import { Logging } from "@google-cloud/logging";
import { ResponseMessage, LogResponse } from "./types";
import  {conversion} from "./individualConversion";


import StructureC from "./StructureC"


declare var require: any

let credentialsLocation = "./heartschat-prod-creds.json"


import admin from 'firebase-admin'


import fs from "fs"
import { clear } from "console";

const credentials = JSON.parse(fs.readFileSync(credentialsLocation,"utf-8"))


admin.initializeApp({
  credential: admin.credential.cert(credentials)
})

const db: Firestore = admin.firestore()


let col: CollectionReference = db.collection("testingCloudFunctions");


let tooCloseToUpload = new Map<String, LogResponse[]>();

function transformMessages(messages: ResponseMessage[]): string {
  return messages.map((message) => message?.text?.text?.join(" ")).join("\n");
}

export async function* readResponses(
  projectId: string,
  logging = new Logging({ projectId })
): AsyncIterable<LogResponse> {

  // end of call is current time, start is 2 days and 2 hours before right now
  const end = new Date();
  const start = new Date(end.getDay() - 2);
  start.setHours(start.getHours() - 2);

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
      intent: metadata.labels.intent ?? "",
      intentCf: metadata.labels.intentCf ?? "",
    };
  }
}

export async function allAtOnce(
  projectId: string, 
  logging = new Logging({ projectId })
  ) {
  // querry for last upload
  let lastDoc = await (await col.orderBy("timestamp","desc").limit(1).get()).docs[0];
  // get date of last upload
  let lastRan: Date =  lastDoc.data().message.timestamp.toDate();
  // cutOff, aka when we stop taking on new data, is 45 ahead last up Load
  let cutOff: Date = lastRan;
  cutOff.setMinutes(lastRan.getMinutes() + 45);
  
  // map for data
  let map = new Map<String, LogResponse[]>();

  // only takes on data 45 minutes before now
  const startTime = new Date();
  startTime.setMinutes(startTime.getMinutes() - 45);
  
  // gets stream
  const stream = readResponses("project id", logging as any);
  // loops
  for await (const response of stream) {
    // gets log's date
    let curDate: Date = new Date(response.timestamp);
    // if it is to close we don't upload it, move to next in loop
    if(curDate > startTime) {
      continue;
    } else{
      // if it is within cut off of last run, enter special case
      if(curDate < cutOff) {
        // if map has already been emptied, and this is older than last upload, then we done
        if(map.size == 0 && curDate < lastRan) {
          return;
        }
        // if map doesn't contain it already, pass it. Else, add it
        if(!map.has(response.responseId)) {
          continue;
        } else {
          map.get(response.responseId)?.push(response);
        }

      } else {
        // if we are witing regular time, add all data: either pre-existing, or new 
        if(map.has(response.responseId)) {
          map.get(response.responseId)?.push(response);  
        } else {
          map.set(response.responseId,[response]);
        }
      }
      // if that data we just uploaded was the first, then upload it to the DB and delete
      // it from the map! 
      if(response.parameters.first_msg == 1 && response.intent == "Default Welcome Intent") {
        let lr: LogResponse[] = map.get(response.responseId) ?? [];
        let temp: Conversation = conversion(lr);
        await StructureC.insertConversation(col,temp);
        map.delete(response.responseId);
      }
    }
  }
}




  