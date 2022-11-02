import  {Conversation} from "./DatabaseInterface"
import {parser} from "./parser"
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
        while(data[k].sessionId == data[i].sessionId){
            messages.push(data[k]);
            k++;
        }
        object['messages'] = messages;
        convos.push(object as Conversation);
        i = k;
    }
    return convos
}
let data  = parser('/Users/christophersebastian/Downloads/negbot_testing_q_conv_merge_2022-06-24.xlsx - _merge (1).csv')
conversion(data)