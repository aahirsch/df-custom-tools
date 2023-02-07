import { google } from "@google-cloud/dialogflow-cx/build/protos/protos";
import { firestore } from "firebase-admin";

export type ResponseMessage = google.cloud.dialogflow.cx.v3.IResponseMessage;

export type DialogflowConfig = {
  projectId: string;
  location: string;
  apiEndpoint: string;
};

export type AgentQuery = {
  sessionId: string;
  agentId: string;
  input: string;
};

export type AgentResponse = {
  output: string;
  page: string;
  parameters: AgentParameters;
  done: boolean;
};

export type AgentParameters = {
  [k: string]: number | string | boolean | null;
};

/* --------- Logging -------------------------------------*/

interface LogMetadata {
  surveyId: string;
  timestamp: string;
  sessionId: string;
  agentId: string;
  responseId: string;
  input: string;
  output: string;
}

export interface LogResponse extends LogMetadata {
  parameters: { [key: string]: any };
}

export interface LogParameter extends LogMetadata {
  name: string;
  value: any;
}
