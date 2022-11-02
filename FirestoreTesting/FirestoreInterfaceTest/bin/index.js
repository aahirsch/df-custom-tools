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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const StructureA_1 = __importDefault(require("./StructureA"));
const StructureB_1 = __importDefault(require("./StructureB"));
const admin = require('firebase-admin');
let credentialsLocation = "../heartschat-prod-creds.json";
let credentials = require(credentialsLocation);
admin.initializeApp({
    credential: admin.credential.cert(credentials)
});
const db = admin.firestore();
const testingCollection = db.collection("testing-1");
function test1() {
    return __awaiter(this, void 0, void 0, function* () {
        let doc = testingCollection.doc("Cyrus' Test Doc");
        console.log((yield doc.get()).data());
        yield doc.set({
            TestField: "TestWritten",
            OtherField: "OtherWritten"
        });
        console.log((yield doc.get()).data());
    });
}
function test2() {
    return __awaiter(this, void 0, void 0, function* () {
        const testingCollection = db.collection("testing-1");
        const badDoc = testingCollection.doc("doc that's not there");
        console.log(badDoc);
        console.log(yield badDoc.get());
        console.log(yield testingCollection.doc("Cyrus' Test Doc"));
        console.log(yield testingCollection.listDocuments());
    });
}
let testMessage = {
    surveyId: "testSurveyId",
    agentId: "testAgentId",
    responseId: "testResponseId",
    input: "testInput",
    output: "testOutput",
    parameters: {
        testParam: "testParamValue",
        testParam2: "testParamValue2"
    },
    timestamp: "testTimestamp"
};
function test3() {
    return __awaiter(this, void 0, void 0, function* () {
        const testingCollection = db.collection("testing-1");
        yield testingCollection.doc("newdoc").collection("F_records").add(testMessage);
    });
}
function test4() {
    return __awaiter(this, void 0, void 0, function* () {
        const testingCollection = db.collection("testing-1");
        const q = testingCollection.where("TestField", "==", "1").limit(1);
        const result = yield q.get();
        result.forEach((doc) => {
            console.log(doc.data());
        });
    });
}
function testUploadConversation(structure, topLevelCollection) {
    return __awaiter(this, void 0, void 0, function* () {
        const testingCollection = db.collection(topLevelCollection);
        const testConversation = {
            surveyId: "testSurveyId",
            agentId: "testAgentId",
            responseId: "testResponseId",
            messages: [
                {
                    input: "testInput1",
                    output: "testOutput1",
                    parameters: {
                        testParam: "testParamValue",
                        testParam2: "testParamValue2"
                    },
                    timestamp: "6/24/2022 4:03"
                },
                {
                    input: "testInput2",
                    output: "testOutput2",
                    parameters: {
                        testParam: "testParamValue",
                        testParam2: "testParamValue2"
                    },
                    timestamp: "6/24/2022 4:03"
                }
            ]
        };
        yield structure.insertConversation(testingCollection, testConversation);
    });
}
testUploadConversation(StructureA_1.default, "testing-A");
testUploadConversation(StructureB_1.default, "testing-B");
