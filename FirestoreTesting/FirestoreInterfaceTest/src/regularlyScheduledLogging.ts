import {Firestore,DocumentData, CollectionReference, DocumentSnapshot, OrderByDirection, Timestamp} from "@google-cloud/firestore"
import { DatabaseInterface,Message, Survey, Conversation } from "./DatabaseInterface"
import { Logging } from "@google-cloud/logging";
import { ResponseMessage, LogResponse } from "./types";
import  {conversion} from "./individualConversion";


import StructureC from "./StructureC"


let credentialsLocation = "/Users/christophersebastian/Downloads/heartschat-prod-a505-firebase-adminsdk-dgjo6-35494c7d54.json"

import fs from "fs"

const credentials = JSON.parse(fs.readFileSync(credentialsLocation,"utf-8"))



declare var require: any


function transformMessages(messages: ResponseMessage[]): string {
  return messages.map((message) => message?.text?.text?.join(" ")).join("\n");
}

export async function* readResponses(
  projId: string,
  start: Date,
  end: Date,
): AsyncIterable<LogResponse> {
  const logging = new Logging({ projectId: projId });  
  
  const stream = logging.getEntriesStream({
    maxApiCalls: 20,
    autoPaginate: true,
    filter: `
      logName = "projects/heartschat-prod-a505/logs/dialogflow-runtime.googleapis.com%2Frequests" 
      timestamp >= "${start.toISOString()}" 
      timestamp <= "${end.toISOString()}" 
      jsonPayload.responseId=~".+"
    `,
  });
  console.log(stream)
  
  for await (const { data, metadata } of stream) {
    console.log("DOES THIS EVER EVEN HAPPEN!?!?!?!?!")
    console.log(data)
    let para = data.queryResult?.parameters
    console.log(JSON.stringify(para))
    para['intent'] = data?.queryResult?.intent?.displayName ?? ""
    para['intentCf'] = data?.queryResult?.intentDetectionConfidence ?? ""
    yield {
      responseId: data.responseId ?? "",
      agentId: metadata.labels?.agent_id ?? "",
      sessionId: metadata.labels?.session_id ?? "",
      timestamp: metadata.timestamp?.toString() ?? "",
      request: data.queryResult?.text ?? "",
      response: transformMessages(data.queryResult?.responseMessages ?? []),
      parameters: para ?? {},
    };
  }
}

export async function allAtOnce(
  projectId: string, 
  dateCol: CollectionReference,
  col: CollectionReference,
  ) {
  // Call our special time collection and get date of last running
  let lastRan = new Date
  let doc = dateCol.doc("time").get().then(ref => {
    let helper = ref.data()
    lastRan = helper?.date
  })
  // Find what time it is right now
  let rn: Date = new Date();
  // Update our special time collection to have last ran be right now  
  dateCol.doc('time').update({
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
  const stream = readResponses(projectId, rn, cutOff);
  console.log(stream)
  // loops
  for await (const response of stream) {
    // gets log's date
    console.log(response)
    console.log("oka, inside, but is anything happening?")
    console.log(JSON.stringify(response))
    let curDate: Date = new Date(response.timestamp);
    // Add to our map
    if(map.has(response.responseId)) {
        map.get(response.responseId)?.push(response);  
    } else {
      map.set(response.responseId,[response]);
    }

    // Check if it was the first message
    if(response.parameters.first_msg == 1 && response.parameters.intent == "Default Welcome Intent") {
      // Check if it is within 60 minutes of now, if it is we don't want anything to do with this data,
      // so we delete it from our map and we'll get it next time
      console.log("i don't think this message is going to print")
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
  console.log("wow, stream ended and I didn't get any response!?")
  // Anything left in the map wil just be data that was already uploaded
  // So I just make sure that the map is clear for next use (it gets reinitalized so useless step but just to be sure) 
  map.clear;
}