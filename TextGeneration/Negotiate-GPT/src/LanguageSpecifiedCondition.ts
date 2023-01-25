import Condition from "./Condition";
import Conversation from "./Conversation";

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

  callAPI:(prompt:string, temperature:number, maxTokens: number, stop:Array<string>) => Promise<string>

  languageSpecification:string

  persistent:boolean = false
  //only applies if persistent
  lastState:boolean | null = null

  needToInclude:NeedToInclude = NeedToInclude.History

  //only applies if needToInclude == NeedToInclude.LastNMessages
  n:number = 1

  checkOn:CheckOn

  constructor(
    languageSpecification:string,
    checkOn:CheckOn,
    callAPI:(prompt:string, temperature:number, maxTokens: number, stop:Array<string>) => Promise<string>,
    needToInclude:NeedToInclude = NeedToInclude.History,
    n:number = 1
    ){
    this.languageSpecification = languageSpecification
    this.callAPI = callAPI
    this.checkOn=checkOn
  }

  init():void {
    if(this.persistent){
      this.lastState = false
    }
  }

  check(conversation:Conversation):Promise<boolean> {
    if(this.persistent && this.lastState){
      return Promise.resolve(true)
    }

    var prompt =""
    
    var lines =[]

    switch(this.needToInclude){
      case NeedToInclude.Preamble:
        prompt+=conversation.config.preamble
        break
      case NeedToInclude.History:
        prompt+=conversation.history
        break
      case NeedToInclude.PreambleAndHistory:
        prompt+=conversation.config.preamble
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
      this.callAPI(prompt, 0.0, 5,[".",","]).then((response:string) => {
        const processedResponse = response.trim().toLowerCase()
        if(processedResponse=="yes"){
          if(this.persistent){this.lastState=true}
          resolve(true)
        }
        else if (processedResponse=="no"){
          resolve(false)
        }
        else{
          //maybe throw some error
          // for now just say no
          resolve(false)
        }
      })
    })
  }

  afterUserMessageCheck(conversation: Conversation): Promise<boolean> {
    if(this.persistent && this.lastState){
      return Promise.resolve(true)
    }
    if(this.checkOn==CheckOn.AfterUserMessage || this.checkOn==CheckOn.Both){
      return this.check(conversation)
    }
    else{
      return Promise.resolve(false)
    }
  }
  afterBotMessageCheck(conversation: Conversation): Promise<boolean>{
    if(this.persistent && this.lastState){
      return Promise.resolve(true)
    }
    if(this.checkOn==CheckOn.AfterBotMessage || this.checkOn==CheckOn.Both){
      return this.check(conversation)
    }
    else{
      return Promise.resolve(false)
    }
  }


}

export {LanguageSpecifiedCondition, CheckOn}