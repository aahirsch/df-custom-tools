import  {Conversation} from "./DatabaseInterface.js"

export const conversion = (data: any[]):Conversation[] => {
    const convos : Conversation[] = [];
    var i = 0;
    while (i < data.length){
        const convo : Conversation = {
            responseId: data[i].responseId,
            surveyId: data[i].surveyId,
            agentId: data[i].agentId,
            messages: []
        }

        var k = i;
        while(k<data.length&&data[k].responseId == data[i].responseId){
            convo.messages.push(data[k]);
            k++;
        }
        convos.push(convo);
        i = k;
    }
    return convos
}
