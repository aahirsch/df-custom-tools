import {Condition, InvalidJSONForCondition} from "./Condition";
import Conversation from "../Conversation";

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

class LanguageSpecifiedCondition implements Condition{

  callAPI: CallAPIFunction

  //NOTE this should not contain any number and thus should not be encoded
  languageSpecification:string

  persistent:boolean = false

  triggerOnce:boolean = false

  //only applies if persistent
  lastState:boolean | null = null

  needToInclude:NeedToInclude = NeedToInclude.History

  //only applies if needToInclude == NeedToInclude.LastNMessages
  n:number = 1

  checkOn:CheckOn

  static fromJSON(json:any, callAPI:CallAPIFunction):LanguageSpecifiedCondition{

    if (json.languageSpecification == undefined){
      throw new InvalidJSONForCondition(json, "languageSpecification")
    }

    var checkOn:CheckOn

    switch(json.checkOn){
      case "AfterUserMessage":
        checkOn = CheckOn.AfterUserMessage
        break
      case "AfterBotMessage":
        checkOn = CheckOn.AfterBotMessage
        break
      case "Both":
        checkOn = CheckOn.Both
        break
      default:
        throw new InvalidJSONForCondition(json, "checkOn")
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

    return new LanguageSpecifiedCondition(
      json.languageSpecification,
      checkOn,
      callAPI,
      needToInclude
    )

  }

  constructor(
    languageSpecification:string,
    checkOn:CheckOn,
    callAPI:CallAPIFunction,
    needToInclude:NeedToInclude = NeedToInclude.History,
    n:number = 1
    ){
    this.languageSpecification = languageSpecification
    this.callAPI = callAPI
    this.checkOn=checkOn
    this.needToInclude = needToInclude
  }

  init():void {
    if(this.persistent){
      this.lastState = false
    }
  }

  check(conversation:Conversation):Promise<boolean> {

    var prompt =""

    prompt += conversation.getCodeDescriptor()
    prompt += "\n\n"
    
    var lines =[]

    switch(this.needToInclude){
      case NeedToInclude.Preamble:
        prompt+=conversation.basicPreamble
        break
      case NeedToInclude.History:
        prompt+=conversation.history
        break
      case NeedToInclude.PreambleAndHistory:
        prompt+=conversation.basicPreamble
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
        for(var i=lines.length-1; i>=0 && i>=lines.length-this.n; i--){
          toAdd.push(lines[i])
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

          //#FF0000 Temporary line
          console.log("\t condition met - "+this.languageSpecification)

          if(this.persistent&&!this.triggerOnce){this.lastState=true}
          this.lastState=true
          resolve(true)
        }
        else if (processedResponse=="no"){
          this.lastState=false
          resolve(false)
        }
        else{
          //maybe throw some error here, the response needs to be logged
          // for now just say no
          this.lastState=false
          resolve(false)
        }
      })
    })
  }

  //the following function is separated for testing and debugging purposes
  askAPI(prompt:string):Promise<string> {
    return this.callAPI(prompt, 0.0, 5,[".",","])
  }


  afterUserMessageCheck(conversation: Conversation): Promise<boolean> {
    if(this.persistent&&this.lastState){
      return Promise.resolve(!this.triggerOnce)
    }
    if(this.checkOn==CheckOn.AfterUserMessage || this.checkOn==CheckOn.Both){
      return this.check(conversation)
    }
    else{
      return Promise.resolve(false)
    }
  }
  
  afterBotMessageCheck(conversation: Conversation): Promise<boolean>{
    if(this.persistent&&this.lastState){
      return Promise.resolve(!this.triggerOnce)
    }
    if(this.checkOn==CheckOn.AfterBotMessage || this.checkOn==CheckOn.Both){
      return this.check(conversation)
    }
    else{
      return Promise.resolve(false)
    }
  }

  setPersistent(persistent: boolean){
    this.persistent = persistent
  }

  setTriggerOnce(triggerOnce: boolean){
    this.triggerOnce = triggerOnce
    if(triggerOnce){
      this.persistent = true
    }
  }
}


export default LanguageSpecifiedCondition

export {LanguageSpecifiedCondition, CheckOn,NeedToInclude}