import  {Conversation} from "./DatabaseInterface"

declare var require: any

export const conversion = (data: any[]):Conversation[] => {
    var convos : Conversation[] = [];
    var i = 0;
    while (i < data.length){
        const object: {[index: string]:any} = {} as Conversation;
        object['surveyId'] = data[i].surveyId;
        object['agentId'] = data[i].agentId;
        object['responseId'] = data[i].responseId;
        var messages = [];
        var k = i;
        while(data[k].surveyId == data[i].surveyId){
            messages.push(data[k]);
            k++;
            if (k==data.length){
                break
            }
        }
        object['messages'] = messages;
        convos.push(object as Conversation);
        i = k;
    }
    return convos
}
