import {InvalidJSONForCondition} from "./Condition";
import Conversation from "../Conversation";
import AbstractCondition from "./AbstractCondition";

enum CheckOn{
  AfterUserMessage,
  AfterBotMessage,
  Both
}

enum NeedToInclude{
  Preamble,
  History,
  PreambleAndHistory,
  LastMessage,
  LastNMessages
}

class LanguageSpecifiedCondition extends AbstractCondition{

  callAPI: CallAPIFunction

  //NOTE this should not contain any number and thus should not be encoded
  languageSpecification:string


  needToInclude:NeedToInclude = NeedToInclude.History

  //only applies if needToInclude == NeedToInclude.LastNMessages
  n:number = 1

  static fromJSON(json:any, callAPI:CallAPIFunction):LanguageSpecifiedCondition{

    if (json.languageSpecification == undefined){
      throw new InvalidJSONForCondition(json, "languageSpecification")
    }

    var needToInclude:NeedToInclude

    switch(json.needToInclude){
      case "Preamble":
        needToInclude = NeedToInclude.Preamble
        break
      case "History":
        needToInclude = NeedToInclude.History
        break
      case "PreambleAndHistory":
        needToInclude = NeedToInclude.PreambleAndHistory
        break
      case "LastMessage":
        needToInclude = NeedToInclude.LastMessage
        break
      case "LastNMessages":
        needToInclude = NeedToInclude.LastNMessages
        break
      default:
        throw new InvalidJSONForCondition(json, "needToInclude")
    }

    const out = new LanguageSpecifiedCondition(
      json.languageSpecification,
      CheckOn.Both,//this will be overwritten when the abstract properties are loaded
      callAPI,
      needToInclude
    )

    //load abstract properties
    out.fromJSON(json)

    return out
  }

  constructor(
    languageSpecification:string,
    checkOn:CheckOn,
    callAPI:CallAPIFunction,
    needToInclude:NeedToInclude = NeedToInclude.History,
    n:number = 1
    ){
      super(checkOn)
      this.languageSpecification = languageSpecification
      this.callAPI = callAPI
      this.needToInclude = needToInclude
  }


  protected check(conversation:Conversation):Promise<boolean> {

    var prompt =""

    prompt += conversation.getCodeDescriptor()
    prompt += "\n\n"
    
    var lines =[]

    switch(this.needToInclude){
      case NeedToInclude.Preamble:
        prompt+=conversation.encodedPreamble
        break
      case NeedToInclude.History:
        prompt+=conversation.history
        break
      case NeedToInclude.PreambleAndHistory:
        prompt+=conversation.encodedPreamble
        prompt+="\n"
        prompt+=conversation.history
        break
      case NeedToInclude.LastMessage:
        lines = conversation.history.split("\n")
        if(lines.length==0){ return Promise.resolve(false) }
        prompt+= lines[lines.length-1]
        break
      case NeedToInclude.LastNMessages:
        lines = conversation.history.split("\n")
        if(lines.length==0){ return Promise.resolve(false) }
        //it is important to ensure order is preserved here
        const toAdd=[]
        var i = lines.length-1
        while(toAdd.length<this.n && i>=0){
          //check that the last message is not an instruction
          if(lines[i][0]!="("){
            toAdd.push(lines[i])
          }
          i--;
        }
        for(var i=toAdd.length-1; i>=0; i--){
          prompt+=toAdd[i]
          prompt+="\n"
        }
        break
    }

    prompt+="\n"
    prompt+=this.languageSpecification

    //give the AI 2 lines of space before writing its comments
    prompt+="\n\n"


    return new Promise<boolean>((resolve, reject) => {
      //we allow 5 tokens so that the AI can spit out some spacing characters
      //but not too many that if the stop sequences fail it will spit out a lot
      //remember stop sequences are not included in the output.
      this.askAPI(prompt).then((response:string) => {
        const processedResponse = response.trim().toLowerCase()
        if(processedResponse=="yes"){
          resolve(true)
        }
        else if (processedResponse=="no"){
          resolve(false)
        }
        else{
          //maybe throw some error here, the response needs to be logged
          // for now just say no
          resolve(false)
        }
      })
    })
  }

  //the following function is separated for testing and debugging purposes
  askAPI(prompt:string):Promise<string> {
    return this.callAPI(prompt, 0.0, 5,[".",","])
  }

}


export default LanguageSpecifiedCondition

export {LanguageSpecifiedCondition, NeedToInclude}