import {CollectionReference, DocumentReference,QuerySnapshot,DocumentData,Timestamp} from "@google-cloud/firestore"

import { DatabaseInterface,Message,Conversation,Survey } from "./DatabaseInterface"


const StructureD:DatabaseInterface = {


  insertMessage: (topLevelCollection:CollectionReference, message: Message): Promise<void> => {
    return new Promise(async (resolve, reject) => {     

      await topLevelCollection.add({
        surveyId: message.surveyId,
        agentId: message.agentId,
        responseId: message.responseId,
        authorizedResearcherIds: [],
        timestamp: Timestamp.fromDate(new Date(message.timestamp)),
        input: message.input,
        output: message.output,
        parameters: message.parameters
      })

      resolve()

    })

  },

  insertConversation: (topLevelCollection:CollectionReference, conversation: Conversation): Promise<void> =>{
    //by the nature of the structure, we can just do repeated calls of insertMessage without compromising efficiency
    return new Promise(async (resolve, reject) => { 
      const promises:Promise<void>[] = conversation.messages.map((message:Message) => {
        //add the surveyId, agentId, and responseId to the message
        return StructureD.insertMessage(topLevelCollection,{
          surveyId: conversation.surveyId,
          agentId: conversation.agentId,
          responseId: conversation.responseId,
          input: message.input,
          output: message.output,
          parameters: message.parameters,
          timestamp: message.timestamp
        } as Message)
      })
      await Promise.all(promises)
      resolve()

    })
  },

  retrieveConversation:(topLevelCollection:CollectionReference,surveyId:string, agentId:string, responseId:string): Promise<Conversation> =>{
    return new Promise(async (resolve, reject) => {
      
      const q1 = await topLevelCollection.where("surveyId", "==", surveyId)
      .where("agentId", "==", agentId)
      .get()

      if(q1.empty){
        reject("No conversation found")
        return
      }

      const out:Conversation ={
        surveyId: surveyId,
        agentId: agentId,
        responseId: responseId,
        messages: []
      } 

      q1.docs.forEach((doc) => {
        const data = doc.data()
        if(data.responseId == responseId){
          out.messages.push({
            input: data.input,
            output: data.output,
            parameters: data.parameters,
            timestamp: data.timestamp.toDate().toString()
          } as Message)
        }
      })

      resolve(out)
      
    })
  },

  retrieveSurvey: (topLevelCollection:CollectionReference,surveyId:string): Promise<Survey> => {
    return new Promise(async (resolve, reject) => {
      const q1 = await topLevelCollection.where("surveyId", "==", surveyId).get()

      if(q1.empty){
        reject("No survey found")
        return
      }

      const out:Survey = {
        surveyId: surveyId,
        conversations: []
      }

      const conversationIdMap:Map<string,Conversation> = new Map()

      q1.forEach( (doc) => {
        const data = doc.data()
        if (data.responseId in conversationIdMap){
          //assert that the map has a value for the responseId
          (conversationIdMap.get(data.responseId) as Conversation).messages.push({
            agentId: data.agentId,
            responseId: data.responseId,
            input: data.input,
            output: data.output,
            parameters: data.parameters,
            timestamp: data.timestamp.toDate().toString()
          } as Message)
        }
        else{
          const newConversation:Conversation = {
            surveyId: data.surveyId,
            agentId: data.agentId,
            responseId: data.responseId,
            messages: [{
              agentId: data.agentId,
              responseId: data.responseId,
              input: data.input,
              output: data.output,
              parameters: data.parameters,
              timestamp: data.timestamp.toDate().toString()
            } as Message]
          }
          conversationIdMap.set(data.responseId, newConversation)
          out.conversations.push(newConversation)
        }
      })

      resolve(out)

    })
  },

  retrieveAll: (topLevelCollection:CollectionReference): Promise<Conversation[]> => {
    return new Promise(async (resolve, reject) => {
      const q1 = await topLevelCollection.get()

      if(q1.empty){
        resolve([])
        return
      }

      const conversations:Conversation[] = []

      const conversationIdMap:Map<string,Conversation> = new Map()

      q1.forEach( (doc) => {
        const data = doc.data()
        if (data.responseId in conversationIdMap){
          //assert that the map has a value for the responseId
          (conversationIdMap.get(data.responseId) as Conversation).messages.push({
            agentId: data.agentId,
            responseId: data.responseId,
            input: data.input,
            output: data.output,
            parameters: data.parameters,
            timestamp: data.timestamp.toDate().toString()
          } as Message)
        }
        else{
          const newConversation:Conversation = {
            surveyId: data.surveyId,
            agentId: data.agentId,
            responseId: data.responseId,
            messages: [{
              agentId: data.agentId,
              responseId: data.responseId,
              input: data.input,
              output: data.output,
              parameters: data.parameters,
              timestamp: data.timestamp.toDate().toString()
            } as Message]
          }
          conversationIdMap.set(data.responseId, newConversation)
          conversations.push(newConversation)
        }
      })

      resolve(conversations)

    })
  },

  giveAccessToSurveys: (topLevelCollection:CollectionReference, researcherId: string, surveyIds: string[]): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      const q1 = await topLevelCollection.where("surveyId", "in", surveyIds).get()

      const myPromises:Promise<any>[] = []

      q1.forEach( (doc) => {
        if (!(researcherId in doc.data().authorizedResearcherIds)) {
          myPromises.push(
            doc.ref.update({
              authorizedResearcherIds: doc.data().authorizedResearcherIds.concat(researcherId)
            })
          )
        }
      })

      await Promise.all(myPromises)
      resolve()
    })
  },

  getAccessibleSurveys: (topLevelCollection:CollectionReference, researcherId: String): Promise<string[]> => {
    return new Promise<string[]>(async (resolve, reject) => {
      const q1 = await topLevelCollection.where("authorizedResearcherIds", "array-contains", researcherId).get()

      const surveyIds:string[] = []

      q1.forEach( (doc) => {
        if (!(doc.data().surveyId in surveyIds)) {  
          surveyIds.push(doc.data().surveyId)
        }
      })

      resolve(surveyIds)
    })
  },

  //NOTE the functionality of this is not perfect, it will return all messges between the start and end organized into conversations
  //If a conversation contains messages that span the date range, it will be returned missing the messages that are outside the range
  getConversationsBetween: (topLevelCollection:CollectionReference, start: Date, end: Date): Promise<Conversation[]> => {
    return new Promise<Conversation[]>(async (resolve, reject) => {
      const q1 = await topLevelCollection.where("startDate", ">=", Timestamp.fromDate(start)).where("endDate", "<=", Timestamp.fromDate(end)).get()

      const conversations:Conversation[] = []

      const conversationIdMap:Map<string,Conversation> = new Map()

      q1.forEach( (doc) => {
        const data = doc.data()
        if (data.responseId in conversationIdMap){
          //assert that the map has a value for the responseId
          (conversationIdMap.get(data.responseId) as Conversation).messages.push({
            agentId: data.agentId,
            responseId: data.responseId,
            input: data.input,
            output: data.output,
            parameters: data.parameters,
            timestamp: data.timestamp.toDate().toString()
          } as Message)
        }
        else{
          const newConversation:Conversation = {
            surveyId: data.surveyId,
            agentId: data.agentId,
            responseId: data.responseId,
            messages: [{
              agentId: data.agentId,
              responseId: data.responseId,
              input: data.input,
              output: data.output,
              parameters: data.parameters,
              timestamp: data.timestamp.toDate().toString()
            } as Message]
          }
          conversationIdMap.set(data.responseId, newConversation)
          conversations.push(newConversation)
        }
      })

      resolve(conversations)
    })
  }
}

export default StructureD