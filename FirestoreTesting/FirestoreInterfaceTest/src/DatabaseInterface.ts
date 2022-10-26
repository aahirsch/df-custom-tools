import {CollectionReference} from "@google-cloud/firestore"

interface Message {
  surveyId: string|null,
  agentId: string|null,
  responseId: string|null,
  input: string,
  output: string,
  parameters:any,
  timestamp: string,
}

interface Conversation {
  responseId: string,
  messages: Message[]
}

interface Survey {
  surveyId: string,
  conversations: Conversation[]
}

interface DatabaseInterface {
  insertMessage: (topLevelCollection:CollectionReference, message: Message) => Promise<void>,
  insertConversation: (topLevelCollection:CollectionReference, conversation:Conversation) => Promise<void>,
  retrieveConversation: (topLevelCollection:CollectionReference) => Promise<Conversation>,
  retrieveSurvey: (topLevelCollection:CollectionReference) => Promise<Survey>,
  retrieveAll: (topLevelCollection:CollectionReference)  => Promise<Conversation[]>,

  giveAccessToSurveys: (topLevelCollection:CollectionReference, researcherId: string, surveyIds: string[]) => Promise<void>,
  getAccessibleSurveys: (topLevelCollection:CollectionReference, researcherId:String) => Promise<string[]>,

  getConversationsBetween: (topLevelCollection:CollectionReference, start: Date, end: Date) => Promise<Conversation[]>

}

export {DatabaseInterface, Message, Conversation, Survey}