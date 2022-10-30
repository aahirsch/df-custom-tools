import {CollectionReference, DocumentReference,QuerySnapshot,DocumentData,Timestamp} from "@google-cloud/firestore"

import { DatabaseInterface,Message,Conversation,Survey } from "./DatabaseInterface"



const readMessagesFromConversation= (conversationDocumentReference:DocumentReference):Promise<Message[]> => {
  return new Promise<Message[]>(async (resolve,reject) => {
    const messages:Message[] = []

    const q1=await conversationDocumentReference.collection("messages").orderBy("timestamp","asc").get()

    q1.forEach((doc) => {
      const data = doc.data()
      messages.push({
        surveyId: data.surveyId,
        agentId: data.agentId,
        responseId: data.responseId,
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
      const conversationStartDate:Timestamp = Timestamp.fromDate(new Date(conversation.messages[0].timestamp))
      const conversationEndDate:Timestamp = Timestamp.fromDate(new Date(conversation.messages[conversation.messages.length-1].timestamp))

      await topLevelCollection.add({
        surveyId: conversation.surveyId,
        agentId: conversation.agentId,
        responseId: conversation.responseId,
        authorizedResearcherIds: [],
        startDate: conversationStartDate,
        endDate: conversationEndDate
      })

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

      const myPromises:Promise<void>[] = []

      q1.forEach( (doc) => {
        myPromises.push(new Promise<void>(async (resolve,reject) => {
          surveyIds.push(doc.data().surveyId)
          resolve()
        }))
      })

      resolve(surveyIds)
    })
  },

  getConversationsBetween: (topLevelCollection:CollectionReference, start: Date, end: Date): Promise<Conversation[]> => {
    return new Promise<Conversation[]>(async (resolve, reject) => {
      const q1 = await topLevelCollection.where("startDate", ">=", Timestamp.fromDate(start)).where("endDate", "<=", Timestamp.fromDate(end)).get()

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
      }
      )

      await Promise.all(myPromises)

      resolve(conversations)
    })
  }
}

export default StructureB