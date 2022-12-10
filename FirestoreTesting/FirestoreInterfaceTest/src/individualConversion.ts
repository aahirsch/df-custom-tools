import  {Conversation} from "./DatabaseInterface.js"



export const conversion = (data: any[]):Conversation => {
    var i = 0;

        const object: {[index: string]:any} = {} as Conversation;
        object['surveyId'] = data[i].surveyId;
        object['agentId'] = data[i].agentId;
        object['responseId'] = data[i].responseId;
        var messages = [];
        for(let conv of data) {
            messages.push(conv)
        }
        object['messages'] = messages;
        return object as Conversation;
}
