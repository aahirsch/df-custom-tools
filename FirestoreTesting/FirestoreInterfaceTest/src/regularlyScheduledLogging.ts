import {Firestore,DocumentData, CollectionReference, DocumentSnapshot, OrderByDirection, Timestamp} from "@google-cloud/firestore"
import { DatabaseInterface,Message, Survey, Conversation } from "./DatabaseInterface"
import { Logging } from "@google-cloud/logging";
import { ResponseMessage, LogResponse } from "./types";
import  {conversion} from "./individualConversion";
import { firestore, storage } from 'firebase-admin'



import StructureC from "./StructureC"


let credentialsLocation = "/Users/christophersebastian/Downloads/heartschat-prod-a505-firebase-adminsdk-dgjo6-35494c7d54.json"

import fs from "fs"
import { resourceUsage } from "process";

const credentials = JSON.parse(fs.readFileSync(credentialsLocation,"utf-8"))



declare var require: any


function transformMessages(messages: ResponseMessage[]): string {
  return messages.map((message) => message?.text?.text?.join(" ")).join("\n");
}

export async function* readResponses(
  projId: string,
  start: String,
  end: String,
): AsyncIterable<LogResponse> {
  const logging = new Logging({ projectId: projId });  

  //const sinkName = 'negbot-conv-logs-pubsub';
  //const sinkNameNew = 'negbot-conv-sink';

  //const sink = logging.sink(sinkName);

  //projects/heartschat-prod-a505/logs/dialogflow-runtime.googleapis.com%2Frequests

  logging
  const filterItems = [
    `logName="projects/heartschat-prod-a505/logs/cloudfunctions.googleapis.com%2Fcloud-functions"`,
    `timestamp >= "${start}"`,
    `timestamp < "${end}"`,
  ];

  const filters = filterItems.join(" AND ");

  const stream = logging.getEntriesStream({
    maxApiCalls: 20,
    autoPaginate: true,
    filter: filters,
    resourceNames: ["projects/heartschat-prod-a505"]
    //heartschat-prod-a505/locations/us-east1/buckets/negbot_sink-1
  });

  for await (const { data} of stream) {
    let para = data?.component?.parameters
    if(para!=undefined) {
      para['intent'] = data?.component?.intent ?? ""
      para['intentCf'] = data?.component?.intentCf ?? ""
    }
    
    yield {
      surveyId: data?.component?.surveyId ?? "",
      responseId: data?.component?.responseId ?? "",
      agentId: data?.component?.agentId ?? "",
      sessionId: data?.component?.sessionId ?? "",
      timestamp: data?.component?.timestamp ?? "",
      input: data?.component?.input ?? "",
      output: data?.component?.output ?? "",
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
  let lastRan = firestore.Timestamp.now()

  await dateCol.get().then((snapshot) => {
    snapshot.docs.forEach(doc =>{
      lastRan = doc.data().date
    })
  });

  // Find what time it is right now
  let rn: firestore.Timestamp = firestore.Timestamp.now()
  // Update our special time collection to have last ran be right now  
  dateCol.doc('time').update({
    date: rn
  });

  // map for data
  let map = new Map<String, LogResponse[]>();

  // Used to determine if we can upload a conversation
  let allowedToUpload: Date = rn.toDate();
  allowedToUpload.setMinutes(allowedToUpload.getMinutes() - 60);
  

  // Limit our search to 60 minutes before the last run
  let cutOff: Date = lastRan.toDate();
  cutOff.setMinutes(cutOff.getMinutes()-60);

  
  // Get Stream



  const stream = readResponses(projectId,  cutOff.toISOString(),rn.toDate().toISOString());

  // loops
  for await (const response of stream) {
    // gets log's date
    if(response.agentId == "") {
      continue;
    }

    let curDate: string = response.timestamp;
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
      if(curDate > allowedToUpload.toISOString()) {
        map.delete(response.responseId);  
      } else {
        // If it is older than 60 minutes then we are all good, we can garunetee that we have captured
        // everything and thus upload that data
        let lr: LogResponse[] = map.get(response.responseId) ?? [];
        if(lr!= undefined) {
          let temp: Conversation = conversion(lr);

          await StructureC.insertConversation(col,temp);
          console.log("uploaded")
        }
        map.delete(response.responseId);
        
      } 
    }
  }
  // Anything left in the map wil just be data that was already uploaded
  // So I just make sure that the map is clear for next use (it gets reinitalized so useless step but just to be sure) 
  map.clear;
}