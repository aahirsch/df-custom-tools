var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Timestamp } from "@google-cloud/firestore";
const readMessagesFromConversation = (conversationDocumentReference) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        const messages = [];
        const q1 = yield conversationDocumentReference.collection("messages").orderBy("timestamp", "asc").get();
        q1.forEach((doc) => {
            const data = doc.data();
            messages.push({
                input: data.input,
                output: data.output,
                parameters: data.parameters,
                timestamp: data.timestamp.toDate().toISOString()
            });
        });
        resolve(messages);
    }));
};
const readConversationsFromSurvey = (surveySnapshot) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        const conversations = [];
        const q1 = yield surveySnapshot.ref.collection("conversations").get();
        const myPromises = [];
        q1.forEach((doc) => {
            const data = doc.data();
            myPromises.push(new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                conversations.push({
                    surveyId: surveySnapshot.data().surveyId,
                    agentId: surveySnapshot.data().agentId,
                    responseId: data.responseId,
                    messages: yield readMessagesFromConversation(doc.ref)
                });
                resolve();
            })));
        });
        //because this is async we need to wait for all the promises to resolve before returning the object
        yield Promise.all(myPromises);
        resolve(conversations);
    }));
};
const StructureA = {
    insertMessage: (topLevelCollection, message) => {
        return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            const messageTimestamp = Timestamp.fromDate(new Date(message.timestamp));
            const q1 = yield topLevelCollection.where("surveyId", "==", message.surveyId)
                .where("agentId", "==", message.agentId)
                .limit(1)
                .get();
            const myDoc1 = q1.empty ?
                yield topLevelCollection.add({
                    surveyId: message.surveyId,
                    agentId: message.agentId,
                    authorizedResearcherIds: [],
                    startDate: messageTimestamp,
                    endDate: messageTimestamp
                })
                : q1.docs[0].ref;
            const q2 = yield myDoc1.collection("conversations").where("responseId", "==", message.responseId).limit(1).get();
            const myDoc2 = q2.empty ?
                yield myDoc1.collection("conversations").add({
                    responseId: message.responseId
                })
                : q2.docs[0].ref;
            yield myDoc2.collection("messages").add({
                input: message.input,
                output: message.output,
                parameters: message.parameters,
                timestamp: messageTimestamp
            });
            //check if the startDate or endDate need to be updated
            if (!q1.empty) {
                const doc1 = q1.docs[0].data();
                if (doc1.startDate > messageTimestamp) {
                    yield myDoc1.update({
                        startDate: messageTimestamp
                    });
                }
                if (doc1.endDate < messageTimestamp) {
                    yield myDoc1.update({
                        endDate: messageTimestamp
                    });
                }
            }
            resolve();
        }));
    },
    insertConversation: (topLevelCollection, conversation) => {
        //the idea here is that we only need to find the collection for the conversation once, and therefore we can gain a little efficiently over multiple calls of insertMessage
        return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            const q1 = yield topLevelCollection.where("surveyId", "==", conversation.surveyId)
                .where("agentId", "==", conversation.agentId)
                .limit(1)
                .get();
            const conversationStartDate = Timestamp.fromDate(new Date(conversation.messages[0].timestamp));
            const conversationEndDate = Timestamp.fromDate(new Date(conversation.messages[conversation.messages.length - 1].timestamp));
            const myDoc1 = q1.empty ?
                yield topLevelCollection.add({
                    surveyId: conversation.surveyId,
                    agentId: conversation.agentId,
                    authorizedResearcherIds: [],
                    startDate: conversationStartDate,
                    endDate: conversationEndDate
                })
                : q1.docs[0].ref;
            const myDoc2 = yield myDoc1.collection("conversations").add({
                responseId: conversation.responseId
            });
            const myPromises = [];
            conversation.messages.forEach((message) => __awaiter(void 0, void 0, void 0, function* () {
                myPromises.push(new Promise((res, rej) => __awaiter(void 0, void 0, void 0, function* () {
                    yield myDoc2.collection("messages").add({
                        input: message.input,
                        output: message.output,
                        parameters: message.parameters,
                        timestamp: Timestamp.fromDate(new Date(message.timestamp))
                    });
                    res();
                })));
            }));
            //check if the startDate or endDate need to be updated
            if (!q1.empty) {
                const doc1 = q1.docs[0].data();
                if (doc1.startDate > conversationStartDate) {
                    yield myDoc1.update({
                        startDate: conversationStartDate
                    });
                }
                if (doc1.endDate < conversationEndDate) {
                    yield myDoc1.update({
                        endDate: conversationEndDate
                    });
                }
                //by the nature of the data, it is very unlikely that the startDate or endDate will need to be updated
                //this is because that would apply that this conversation spanned over all the other conversations in the survey
            }
            yield Promise.all(myPromises);
            resolve();
        }));
    },
    retrieveConversation: (topLevelCollection, surveyId, agentId, responseId) => {
        return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            const q1 = yield topLevelCollection.where("surveyId", "==", surveyId)
                .where("agentId", "==", agentId)
                .limit(1)
                .get();
            if (q1.empty) {
                reject("No conversation found");
                return;
            }
            const q2 = yield q1.docs[0].ref.collection("conversations").where("responseId", "==", responseId).limit(1).get();
            if (q2.empty) {
                reject("No conversation found");
                return;
            }
            resolve({
                surveyId: surveyId,
                agentId: agentId,
                responseId: responseId,
                messages: yield readMessagesFromConversation(q2.docs[0].ref)
            });
        }));
    },
    retrieveSurvey: (topLevelCollection, surveyId) => {
        return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            const q1 = yield topLevelCollection.where("surveyId", "==", surveyId).get();
            if (q1.empty) {
                reject("No survey found");
                return;
            }
            const conversations = [];
            const myPromises = [];
            q1.forEach((doc) => {
                myPromises.push(new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                    conversations.push(yield readConversationsFromSurvey(doc));
                    resolve();
                })));
            });
            yield Promise.all(myPromises);
            resolve({
                surveyId: surveyId,
                conversations: conversations.flat()
            });
        }));
    },
    retrieveAll: (topLevelCollection) => {
        return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            const q1 = yield topLevelCollection.get();
            if (q1.empty) {
                resolve([]);
                return;
            }
            const conversations = [];
            const myPromises = [];
            q1.forEach((doc) => {
                myPromises.push(new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                    conversations.push(yield readConversationsFromSurvey(doc));
                    resolve();
                })));
            });
            yield Promise.all(myPromises);
            resolve(conversations.flat());
        }));
    },
    giveAccessToSurveys: (topLevelCollection, researcherId, surveyIds) => {
        return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            const q1 = yield topLevelCollection.where("surveyId", "in", surveyIds).get();
            const myPromises = [];
            q1.forEach((doc) => {
                if (!(doc.data().authorizedResearcherIds.includes(researcherId))) {
                    myPromises.push(doc.ref.update({
                        authorizedResearcherIds: doc.data().authorizedResearcherIds.concat(researcherId)
                    }));
                }
            });
            yield Promise.all(myPromises);
            resolve();
        }));
    },
    getAccessibleSurveys: (topLevelCollection, researcherId) => {
        return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            const q1 = yield topLevelCollection.where("authorizedResearcherIds", "array-contains", researcherId).get();
            const surveyIds = [];
            q1.forEach((doc) => {
                surveyIds.push(doc.data().surveyId);
            });
            resolve(surveyIds);
        }));
    },
    getConversationsBetween: (topLevelCollection, start, end) => {
        return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            //because of the limitations of firestore, we can only query with ord on one field at a time (but we can use multiple ords)
            //this implementation will use one query that overshoots(giving us all surveys after the start) and then filter hose down here
            //NOTE this may create an undue burden on the client if this code is run client side
            const q1 = yield topLevelCollection.where("startDate", ">=", Timestamp.fromDate(start)).get();
            //.where("endDate", "<=", Timestamp.fromDate(end)).get()
            const conversations = [];
            const myPromises = [];
            q1.forEach((doc) => {
                if (doc.data().endDate.toDate() <= end) {
                    myPromises.push(new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                        conversations.push(yield readConversationsFromSurvey(doc));
                        resolve();
                    })));
                }
            });
            yield Promise.all(myPromises);
            resolve(conversations.flat());
        }));
    }
};
export default StructureA;
