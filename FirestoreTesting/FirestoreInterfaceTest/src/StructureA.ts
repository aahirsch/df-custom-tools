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

const readConversationsFromSurvey = (surveyDocumentReference:DocumentReference):Promise<Conversation[]> => {
  return new Promise<Conversation[]>(async (resolve,reject) => {
    const conversations:Conversation[] = []

    const q1=await surveyDocumentReference.collection("conversations").get()

    const myPromises:Promise<void>[] = []

    q1.forEach((doc) => {
      const data = doc.data()
      myPromises.push(
        new Promise<void>(async (resolve,reject) => {
          conversations.push({
            surveyId: data.surveyId,
            agentId: data.agentId,
            responseId: data.responseId,
            messages: await readMessagesFromConversation(doc.ref)
          })
          resolve()
        })
      )
    })
    
    //because this is async we need to wait for all the promises to resolve before returning the object
    await Promise.all(myPromises)

    resolve(conversations)

  })
}


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
          await myDoc1.update({
            startDate: conversationStartDate
          })
        }
        if(doc1.endDate < conversationEndDate){
          await myDoc1.update({
            endDate: conversationEndDate
          })
        }
        //by the nature of the data, it is very unlikely that the startDate or endDate will need to be updated
        //this is because that would apply that this conversation spanned over all the other conversations in the survey
      }

      resolve()

    })
  },

  retrieveConversation:(topLevelCollection:CollectionReference,surveyId:string, agentId:string, responseId:string): Promise<Conversation> =>{
    return new Promise(async (resolve, reject) => {
      const q1 = await topLevelCollection.where("surveyId", "==", surveyId)
      .where("agentId", "==", agentId)
      .limit(1)
      .get()

      if(q1.empty){
        reject("No conversation found")
        return
      }

      const q2 = await q1.docs[0].ref.collection("conversations").where("responseId", "==", responseId).limit(1).get()

      if(q2.empty){
        reject("No conversation found")
        return
      }

      resolve( {
        surveyId: surveyId,
        agentId: agentId,
        responseId: responseId,
        messages: await readMessagesFromConversation(q2.docs[0].ref)
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

      const conversations:Conversation[][] = []
      
      const myPromises:Promise<void>[] = []

      q1.forEach( (doc) => {
        myPromises.push(new Promise<void>(async (resolve, reject) => {
          conversations.push(await readConversationsFromSurvey(doc.ref))
          resolve()
        }))
        
      })

      await Promise.all(myPromises)

      resolve( {
        surveyId: surveyId,
        conversations: conversations.flat()
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

      const conversations:Conversation[][] = []
      
      const myPromises:Promise<void>[] = []

      q1.forEach( (doc) => {
        myPromises.push(new Promise<void>(async (resolve, reject) => {
          conversations.push(await readConversationsFromSurvey(doc.ref))
          resolve()
        }))
        
      })

      await Promise.all(myPromises)

      resolve(conversations.flat())

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
        surveyIds.push(doc.data().surveyId)
      })

      resolve(surveyIds)
    })
  },

  getConversationsBetween: (topLevelCollection:CollectionReference, start: Date, end: Date): Promise<Conversation[]> => {
    return new Promise<Conversation[]>(async (resolve, reject) => {
      const q1 = await topLevelCollection.where("startDate", ">=", Timestamp.fromDate(start)).where("endDate", "<=", Timestamp.fromDate(end)).get()

      const conversations:Conversation[][] = []

      const myPromises:Promise<void>[] = []

      q1.forEach( (doc) => {
        myPromises.push(new Promise<void>(async (resolve, reject) => {
          conversations.push(await readConversationsFromSurvey(doc.ref))
          resolve()
        }))
      }
      )

      await Promise.all(myPromises)

      resolve(conversations.flat())
    })
  }
}

export default StructureA