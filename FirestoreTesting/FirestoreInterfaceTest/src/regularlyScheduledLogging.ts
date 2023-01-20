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
  // Querry the db for last upload filted based on time
  // If we filter on end-date, then we do not have to do anything special with the query call
  // becuase end-date is a top level member of each document and we can use that to determine 
  // when is the oldest end date (instead of seaching each individual message to find which)
  // is the odlest
  let lastDoc = await (await col.orderBy("end-date","desc").limit(1).get()).docs[0];
  // Get the date out of the last upload
  let lastRan: Date =  lastDoc.data().message.timestamp.toDate();

  
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
    
    // Break condition: if map has already been emptied, and curDate is older than last run, then we done
    // Becuase we know that we have traversed through all the logs and comppleted
    // all uploads. As far as I can tell, this will always be met at some point. 
    if(map.size == 0 && curDate < lastRan) {
      return; 
    }

    // if it is within 45 minutes of now, we don't upload it, move to next in loop
    if(curDate > startTime) {
      continue;
    } else{
      // everything below this line is done with the assumption that the message is older 
      // than 45 minutes


      // If we have reached the time of last upload, we only want to add messages that 
      // we have already added to our map so...
      if(curDate < lastRan) {
        // ...If map doesn't contain the ID, we don't add it... 
        if(!map.has(response.responseId)) {
          continue;
        } else {
          //...Else means our map does contain this ID so we add it
          map.get(response.responseId)?.push(response);
        }

      } else {
        //Here, we know that we are before the lastRan time, so we always add
        // This inner logic is just so we properly add this message to our map
        if(map.has(response.responseId)) {
          map.get(response.responseId)?.push(response);  
        } else {
          map.set(response.responseId,[response]);
        }
      }
      // if that data we just uploaded was the first, then we know we have gotten all the possible
      // data from this response ID, adn we can thus upload it to the DB and delete it from the map! 
      if(response.parameters.first_msg == 1 && response.intent == "Default Welcome Intent") {
        let lr: LogResponse[] = map.get(response.responseId) ?? [];
        let temp: Conversation = conversion(lr);
        await StructureC.insertConversation(col,temp);
        map.delete(response.responseId);
      }
    }
  }
}




  