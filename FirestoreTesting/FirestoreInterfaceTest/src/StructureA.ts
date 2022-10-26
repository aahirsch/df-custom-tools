import {CollectionReference, DocumentReference,QuerySnapshot,DocumentData,Timestamp} from "@google-cloud/firestore"

import { DatabaseInterface,Message,Conversation,Survey } from "./DatabaseInterface"

const StructureA:DatabaseInterface = {
  insertMessage: (topLevelCollection:CollectionReference, message: Message): Promise<void> => {
    return new Promise(async (resolve, reject) => {     

      const messageTimestamp:Timestamp = Timestamp.fromDate(new Date(message.timestamp))

      const q1 = await topLevelCollection.where("surveyId", "==", message.surveyId)
      .where("agentId", "==", message.agentId)
      .limit(1)
      .get()

      const myDoc1 = q1.empty ? 
        await topLevelCollection.add({
            surveyId: message.surveyId,
            agentId: message.agentId,
            authorizedResearcherIds: [],
            startDate: messageTimestamp,
            endDate: messageTimestamp
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
          timestamp: messageTimestamp})

      //check if the startDate or endDate need to be updated
      if(!q1.empty){
        const doc1 = q1.docs[0].data()
        if(doc1.startDate > messageTimestamp){
          myDoc1.update({
            startDate: messageTimestamp
          })
        }
        if(doc1.endDate < messageTimestamp){
          myDoc1.update({
            endDate: messageTimestamp
          })
        }
      }

      resolve()

    })

  },

  insertConversation: (topLevelCollection:CollectionReference, conversation: Conversation): Promise<void> =>{
    //the idea here is that we only need to find the collection for the conversation once, and therefore we can gain a little efficiently over multiple calls of insertMessage

    return new Promise(async (resolve, reject) => {
      const q1 = await topLevelCollection.where("surveyId", "==", conversation.surveyId)
      .where("agentId", "==", conversation.agentId)
      .limit(1)
      .get()

      const conversationStartDate:Timestamp = Timestamp.fromDate(new Date(conversation.messages[0].timestamp))
      const conversationEndDate:Timestamp = Timestamp.fromDate(new Date(conversation.messages[conversation.messages.length-1].timestamp))

      const myDoc1 = q1.empty ? 
        await topLevelCollection.add({
            surveyId: conversation.surveyId,
            agentId: conversation.agentId,
            authorizedResearcherIds: [],
            startDate: conversationStartDate,
            endDate: conversationEndDate 
          })
          : q1.docs[0].ref

      const myDoc2 = await myDoc1.collection("conversations").add(
        {
          responseId: conversation.responseId
        })

      conversation.messages.forEach(async (message) => {
      myDoc2.collection("messages").add(
        {
          input: message.input,
          output: message.output,
          parameters: message.parameters,
          timestamp: Timestamp.fromDate(new Date(message.timestamp))})
      })

      //check if the startDate or endDate need to be updated
      if(!q1.empty){
        const doc1 = q1.docs[0].data()
        if(doc1.startDate > conversationStartDate){
          myDoc1.update({
            startDate: conversationStartDate
          })
        }
        if(doc1.endDate < conversationEndDate){
          myDoc1.update({
            endDate: conversationEndDate
          })
        }
        //by the nature of the data, it is very unlikely that the startDate or endDate will need to be updated
        //this is because that would apply that this conversation spanned over all the other conversations in the survey
      }

      resolve()

    })
  },

  retrieveConversation:(topLevelCollection:CollectionReference, responseId:string): Promise<Conversation> =>{
    return new Promise(async (resolve, reject) => {
      //use collecitonGroup querry to get all the conversations in the database
      
      reject() 

    })
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