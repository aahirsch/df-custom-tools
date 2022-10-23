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
test1();
