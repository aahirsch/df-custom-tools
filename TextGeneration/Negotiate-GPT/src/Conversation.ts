import Config from "./Config";
import ControlSystem from "./ControlSystem";

class Conversation {
  config:Config
  callAPI:(prompt:string, temperature:number, maxTokens: number, stop:Array<string>) => Promise<string>
  controlSystem:ControlSystem
  messages:Array<[string,string]> = []
  history:string =""
  pendingInstructions:Array<string> =new Array<string>()

  constructor(
    config:Config, 
    callAPI:(prompt:string, temperature:number, maxTokens: number, stop:Array<string>) => Promise<string>
    ) {
    this.config = config
    this.callAPI = callAPI
    this.controlSystem = ControlSystem.fromJSON(config.controlSystem)
  }

  sendMessage(message:string):Promise<string>{

    this.history+= "\n" + this.config.humanPartyName + ": " + message 

    return new Promise<string>(async (resolve, reject) => {

      //do checks
      await this.controlSystem.onUserMessage(this)

      //add instructions if there are any
      if(this.pendingInstructions.length>0){
        this.history+="\n("
        for(let i=0;i<this.pendingInstructions.length;i++){
          this.history+=this.pendingInstructions[i]
          this.history+=" "
        }
        this.history+=")"
      }
      this.pendingInstructions= new Array<string>()

      const prompt = this.config.preamble + "\n" + this.history +"\n" + this.config.aiPartyName + ": "
      const response = (await this.callAPI(
        prompt, this.config.temperature,
        this.config.maxOutputLength,
        [this.config.humanPartyName+":",this.config.aiPartyName+":"]
        )).trim()

      this.history+= "\n" + this.config.aiPartyName + ": " + response
      this.messages.push([message, response])

      //do checks
      await this.controlSystem.onBotMessage(this)

      resolve(response)

    })
  } 

  submitInstruction(instruction:string):void {
    this.pendingInstructions.push(instruction)
  }


}


export default Conversation