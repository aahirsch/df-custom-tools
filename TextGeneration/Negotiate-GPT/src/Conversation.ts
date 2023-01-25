import Config from "./Config";
import ControlSystem from "./ControlSystem";

class Conversation {
  config:Config
  callAPI:(prompt:string, temperature:number, maxTokens: number, stop:Array<string>) => Promise<string>
  controlSystem:ControlSystem
  messages:Array<[string,string]> = []
  history:string =""

  constructor(
    config:Config, 
    callAPI:(prompt:string, temperature:number, maxTokens: number, stop:Array<string>) => Promise<string>,
    controlSystem:ControlSystem) {
    this.config = config
    this.callAPI = callAPI
    this.controlSystem = controlSystem
  }

  sendMessage(message:string):Promise<string>{
    this.history+= "\n" + this.config.humanPartyName + ": " + message 

    //do checks

    //add any instructions

    //get response from API
    return new Promise<string>((resolve, reject) => {
      const prompt = this.config.preamble + "\n" + this.history +"\n" + this.config.aiPartyName + ": "
      this.callAPI(
        prompt, this.config.temperature,
        this.config.maxOutputLength,
        [this.config.humanPartyName+":",this.config.aiPartyName+":"]
        ).then((response:string) => {
          this.history+= "\n" + this.config.aiPartyName + ": " + response
          this.messages.push([message, response])
          resolve(response)
      })
    })
  } 

  submitInstruction(instruction:string):void {
    this.history += "\n(" + instruction+")"
  }


}


export default Conversation