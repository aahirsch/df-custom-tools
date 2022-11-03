import {CollectionReference, DocumentReference,QuerySnapshot,DocumentData,Timestamp} from "@google-cloud/firestore"

import { DatabaseInterface,Message,Conversation,Survey } from "./DatabaseInterface"



const readMessagesFromConversation= (conversationDocumentReference:DocumentReference):Promise<Message[]> => {
  return new Promise<Message[]>(async (resolve,reject) => {
    const messages:Message[] = []

    const q1=await conversationDocumentReference.collection("messages").orderBy("timestamp","asc").get()

    q1.forEach((doc) => {
      const data = doc.data()
      messages.push({
        input: data.input,
        output: data.output,
        parameters: data.parameters,
        timestamp: (data.timestamp as Timestamp).toDate().toISOString()
      })
    })

    resolve(messages)
  })
}


const StructureB:DatabaseInterface = {


  insertMessage: (topLevelCollection:CollectionReference, message: Message): Promise<void> => {
    return new Promise(async (resolve, reject) => {     

      const messageTimestamp:Timestamp = Timestamp.fromDate(new Date(message.timestamp))

      const q1 = await topLevelCollection.where("surveyId", "==", message.surveyId)
      .where("agentId", "==", message.agentId)
      .where("responseId", "==", message.responseId)
      .limit(1)
      .get()

      const myDoc1 = q1.empty ? 
        await topLevelCollection.add({
            surveyId: message.surveyId,
            agentId: message.agentId,
            responseId: message.responseId,
            authorizedResearcherIds: [],
            startDate: messageTimestamp,
            endDate: messageTimestamp
          })
          : q1.docs[0].ref

      myDoc1.collection("messages").add(
        {
          input: message.input,
          output: message.output,
          parameters: message.parameters,
          timestamp: messageTimestamp})

      //check if the startDate or endDate need to be updated
      if(!q1.empty){
        const doc1 = q1.docs[0].data()
        if(doc1.startDate > messageTimestamp){
          await myDoc1.update({
            startDate: messageTimestamp
          })
        }
        if(doc1.endDate < messageTimestamp){
          await myDoc1.update({
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
      const conversationStartDate:Timestamp = Timestamp.fromDate(new Date(conversation.messages[0].timestamp))
      const conversationEndDate:Timestamp = Timestamp.fromDate(new Date(conversation.messages[conversation.messages.length-1].timestamp))

      const myDoc1 = await topLevelCollection.add({
        surveyId: conversation.surveyId,
        agentId: conversation.agentId,
        responseId: conversation.responseId,
        authorizedResearcherIds: [],
        startDate: conversationStartDate,
        endDate: conversationEndDate
      })

      const myPromises:Promise<any>[] = []

      conversation.messages.forEach(async (message) => {
        const messageTimestamp:Timestamp = Timestamp.fromDate(new Date(message.timestamp))
        myPromises.push(myDoc1.collection("messages").add(
          {
            input: message.input,
            output: message.output,
            parameters: message.parameters,
            timestamp: messageTimestamp
          }))
      })

      await Promise.all(myPromises)

      resolve()
    })
  },

  retrieveConversation:(topLevelCollection:CollectionReference,surveyId:string, agentId:string, responseId:string): Promise<Conversation> =>{
    return new Promise(async (resolve, reject) => {
      const q1 = await topLevelCollection.where("surveyId", "==", surveyId)
      .where("agentId", "==", agentId)
      .where("responseId", "==", responseId)
      .limit(1)
      .get()

      if(q1.empty){
        reject("No conversation found")
        return
      }

      const data = q1.docs[0].data()

      resolve( {
        surveyId: data.surveyId,
        agentId: data.agentId,
        responseId: data.responseId,
        messages: await readMessagesFromConversation(q1.docs[0].ref)
      } as Conversation)
      
    })
  },

  retrieveSurvey: (topLevelCollection:CollectionReference,surveyId:string): Promise<Survey> => {
    return new Promise(async (resolve, reject) => {
      const q1 = await topLevelCollection.where("surveyId", "==", surveyId).get()

      if(q1.empty){
        reject("No survey found")
        return
      }

      const conversations:Conversation[] = []
      
      const myPromises:Promise<void>[] = []

      q1.forEach( (doc) => {
        myPromises.push(new Promise<void>(async (resolve, reject) => {
          conversations.push({
            surveyId: doc.data().surveyId,
            agentId: doc.data().agentId,
            responseId: doc.data().responseId,
            messages: await readMessagesFromConversation(doc.ref)
          } as Conversation)
          resolve()
        }))
        
      })

      await Promise.all(myPromises)

      resolve( {
        surveyId: surveyId,
        conversations: conversations
      } as Survey)

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
      
      const myPromises:Promise<void>[] = []

      q1.forEach( (doc) => {
        myPromises.push(new Promise<void>(async (resolve, reject) => {
          conversations.push({
            surveyId: doc.data().surveyId,
            agentId: doc.data().agentId,
            responseId: doc.data().responseId,
            messages: await readMessagesFromConversation(doc.ref)
          } as Conversation)
          resolve()
        }))
        
      })

      await Promise.all(myPromises)

      resolve(conversations)

    })
  },

  giveAccessToSurveys: (topLevelCollection:CollectionReference, researcherId: string, surveyIds: string[]): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      const q1 = await topLevelCollection.where("surveyId", "in", surveyIds).get()

      const myPromises:Promise<any>[] = []

      q1.forEach( (doc) => {
        if (!(doc.data().authorizedResearcherIds.includes(researcherId))){
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
        surveyIds.push(doc.data().surveyId)
      })

      resolve(surveyIds)
    })
  },

  getConversationsBetween: (topLevelCollection:CollectionReference, start: Date, end: Date): Promise<Conversation[]> => {
    return new Promise<Conversation[]>(async (resolve, reject) => {
      //because of the limitations of firestore, we can only query with ord on one field at a time (but we can use multiple ords)
      //this implementation will use one query that overshoots(giving us all surveys after the start) and then filter hose down here
      //NOTE this may create an undue burden on the client if this code is run client side
      
      const q1 = await topLevelCollection.where("startDate", ">=", Timestamp.fromDate(start)).get()

      const conversations:Conversation[] = []

      const myPromises:Promise<void>[] = []

      q1.forEach( (doc) => {
        if(doc.data().endDate.toDate() <= end){
          myPromises.push(new Promise<void>(async (resolve, reject) => {
            conversations.push({
              surveyId: doc.data().surveyId,
              agentId: doc.data().agentId,
              responseId: doc.data().responseId,
              messages: await readMessagesFromConversation(doc.ref)
            } as Conversation)
            resolve()
          }))
        }
      })

      await Promise.all(myPromises)

      resolve(conversations)
    })
  }
}

export default StructureB