"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = require("@google-cloud/firestore");
const StructureA = {
    insertMessage: (topLevelCollection, message) => {
        return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            const messageTimestamp = firestore_1.Timestamp.fromDate(new Date(message.timestamp));
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
            myDoc2.collection("messages").add({
                input: message.input,
                output: message.output,
                parameters: message.parameters,
                timestamp: messageTimestamp
            });
            //check if the startDate or endDate need to be updated
            if (!q1.empty) {
                const doc1 = q1.docs[0].data();
                if (doc1.startDate > messageTimestamp) {
                    myDoc1.update({
                        startDate: messageTimestamp
                    });
                }
                if (doc1.endDate < messageTimestamp) {
                    myDoc1.update({
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
            const conversationStartDate = firestore_1.Timestamp.fromDate(new Date(conversation.messages[0].timestamp));
            const conversationEndDate = firestore_1.Timestamp.fromDate(new Date(conversation.messages[conversation.messages.length - 1].timestamp));
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
            conversation.messages.forEach((message) => __awaiter(void 0, void 0, void 0, function* () {
                myDoc2.collection("messages").add({
                    input: message.input,
                    output: message.output,
                    parameters: message.parameters,
                    timestamp: firestore_1.Timestamp.fromDate(new Date(message.timestamp))
                });
            }));
            //check if the startDate or endDate need to be updated
            if (!q1.empty) {
                const doc1 = q1.docs[0].data();
                if (doc1.startDate > conversationStartDate) {
                    myDoc1.update({
                        startDate: conversationStartDate
                    });
                }
                if (doc1.endDate < conversationEndDate) {
                    myDoc1.update({
                        endDate: conversationEndDate
                    });
                }
                //by the nature of the data, it is very unlikely that the startDate or endDate will need to be updated
                //this is because that would apply that this conversation spanned over all the other conversations in the survey
            }
        }));
    },
    retrieveConversation: (topLevelCollection) => {
        throw new Error("Function not implemented.");
    },
    retrieveSurvey: (topLevelCollection) => {
        throw new Error("Function not implemented.");
    },
    retrieveAll: (topLevelCollection) => {
        throw new Error("Function not implemented.");
    },
    giveAccessToSurveys: (topLevelCollection, researcherId, surveyIds) => {
        throw new Error("Function not implemented.");
    },
    getAccessibleSurveys: (topLevelCollection, researcherId) => {
        throw new Error("Function not implemented.");
    },
    getConversationsBetween: (topLevelCollection, start, end) => {
        throw new Error("Function not implemented.");
    }
};
exports.default = StructureA;
