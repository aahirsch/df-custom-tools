import {CollectionReference, DocumentReference,QuerySnapshot,DocumentData,Timestamp} from "@google-cloud/firestore"

import { DatabaseInterface,Message,Conversation,Survey } from "./DatabaseInterface"

const StructureA:DatabaseInterface = {
  insertMessage: (topLevelCollection:CollectionReference, message: Message): Promise<void> => {
    return new Promise(async (resolve, reject) => {     

      const q1 = await topLevelCollection.where("surveyId", "==", message.surveyId)
      .where("agentId", "==", message.agentId)
      .limit(1)
      .get()

      const myDoc1 = q1.empty ? 
        await topLevelCollection.add({
            surveyId: message.surveyId,
            agentId: message.agentId,
            authorizedResearcherIds: [],
            startDate: message.timestamp,
            endDate: message.timestamp
          })
          : q1.docs[0].ref

      const q2 = await myDoc1.collection("conversations").where("responseId", "==", message.responseId).limit(1).get()

      const myDoc2 = q2.empty ?
        await myDoc1.collection("conversations").add({
          responseId: message.responseId
        })
        : q2.docs[0].ref

      myDoc2.collection("messages").add(
        {
          input: message.input,
          output: message.output,
          parameters: message.parameters,
          timestamp: Timestamp.fromDate(new Date(message.timestamp))})

      //check if the startDate or endDate need to be updated
      if(!q1.empty){
        const doc1 = q1.docs[0].data()
        if(doc1.startDate > message.timestamp){
          myDoc1.update({
            startDate: message.timestamp
          })
        }
        if(doc1.endDate < message.timestamp){
          myDoc1.update({
            endDate: message.timestamp
          })
        }
      }

      resolve()

    })

  },

  insertConversation: (topLevelCollection:CollectionReference, conversation: Conversation): Promise<void> =>{
    throw new Error("Function not implemented.");
  },

  retrieveConversation:(topLevelCollection:CollectionReference): Promise<Conversation> =>{
    throw new Error("Function not implemented.");
  },

  retrieveSurvey: (topLevelCollection:CollectionReference): Promise<Survey> => {
    throw new Error("Function not implemented.");
  },

  retrieveAll: (topLevelCollection:CollectionReference): Promise<Conversation[]> => {
    throw new Error("Function not implemented.");
  },

  giveAccessToSurveys: (topLevelCollection:CollectionReference, researcherId: string, surveyIds: string[]): Promise<void> => {
    throw new Error("Function not implemented.");
  },

  getAccessibleSurveys: (topLevelCollection:CollectionReference, researcherId: String): Promise<string[]> => {
    throw new Error("Function not implemented.");
  },

  getConversationsBetween: (topLevelCollection:CollectionReference, start: Date, end: Date): Promise<Conversation[]> => {
    throw new Error("Function not implemented.");
  }
}


export default StructureA