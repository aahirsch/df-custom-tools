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

let dateCol: CollectionReference = db.collection("lastRan");

function transformMessages(messages: ResponseMessage[]): string {
  return messages.map((message) => message?.text?.text?.join(" ")).join("\n");
}

export async function* readResponses(
  projectId: string,
  start: Date,
  end: Date,
  logging = new Logging({ projectId })
): AsyncIterable<LogResponse> {

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
  // Call our special time collection and get date of last running
  let doc = await (await dateCol.get()).docs[0];
  let lastRan: Date =  doc.data().timestamp.toDate();
  // Find what time it is right now
  let rn: Date = new Date();
  // Update our special time collection to have last ran be right now  
  dateCol.doc().set({
    date: rn
  });

  // map for data
  let map = new Map<String, LogResponse[]>();

  // Used to determine if we can upload a conversation
  const allowedToUpload: Date = rn;
  allowedToUpload.setMinutes(allowedToUpload.getMinutes() - 60);

  // Limit our search to 60 minutes before the last run
  const cutOff: Date = lastRan;
  cutOff.setMinutes(cutOff.getMinutes()-60);
  
  // Get Stream
  const stream = readResponses("project id", rn, cutOff, logging as any);
  // loops
  for await (const response of stream) {
    // gets log's date
    let curDate: Date = new Date(response.timestamp);
    // Add to our map
    if(map.has(response.responseId)) {
        map.get(response.responseId)?.push(response);  
    } else {
      map.set(response.responseId,[response]);
    }

    // Check if it was the first message
    if(response.parameters.first_msg == 1 && response.intent == "Default Welcome Intent") {
      // Check if it is within 60 minutes of now, if it is we don't want anything to do with this data,
      // so we delete it from our map and we'll get it next time
      if(curDate > allowedToUpload) {
        map.delete(response.responseId);  
      } else {
        // If it is older than 60 minutes then we are all good, we can garunetee that we have captured
        // everything and thus upload that data
        let lr: LogResponse[] = map.get(response.responseId) ?? [];
        let temp: Conversation = conversion(lr);
        await StructureC.insertConversation(col,temp);
        map.delete(response.responseId);
      } 
    }
  }
  // Anything left in the map wil just be data that was already uploaded
  // So I just make sure that the map is clear for next use (it gets reinitalized so useless step but just to be sure) 
  map.clear;
}




  