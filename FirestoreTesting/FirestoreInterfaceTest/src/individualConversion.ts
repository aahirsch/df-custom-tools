import  {Conversation} from "./DatabaseInterface.js"



export const conversion = (data: any[]):Conversation => {
        const object: {[index: string]:any} = {} as Conversation;
        object['surveyId'] = data[0].surveyId;
        object['agentId'] = data[0].agentId;
        object['responseId'] = data[0].responseId;
        object['messages'] = data;
        return object as Conversation;
}
