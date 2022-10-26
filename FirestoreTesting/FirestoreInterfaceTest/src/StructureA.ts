import {CollectionReference, DocumentReference} from "@google-cloud/firestore"

import { DatabaseInterface,Message,Conversation,Survey } from "./DatabaseInterface"

let StructureA:DatabaseInterface = {
  insertMessage: (topLevelCollection:CollectionReference, message: Message): Promise<void> => {
    throw new Error("Method not implemented.");
  },

  insertConversation: (topLevelCollection:CollectionReference, conversation: Conversation): Promise<void> =>{
    throw new Error("Function not implemented.");
  },

  retrieveConversation:(topLevelCollection:CollectionReference): Promise<Conversation> {
    throw new Error("Function not implemented.");
  },

  retrieveSurvey: (topLevelCollection:CollectionReference): Promise<Survey> {
    throw new Error("Function not implemented.");
  },

  retrieveAll: (topLevelCollection:CollectionReference): Promise<Conversation[]> {
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