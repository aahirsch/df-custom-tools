import Config from "./Config";
import ControlSystem from "./ControlSystem";
import {PricingModel, pricingModelFromJSON, } from "./PricingModels/PricingModel";
import { normalize } from "./TextProcessing/normalize";
import NumberCoding from "./TextProcessing/NumberCoding";

class Conversation {
  public config:Config
  //NOTE this contains raw(uncoded) messages
  public messages:Array<[string,string]> = []
  public history:string =""
  //the preamble without codes
  public basicPreamble:string

  //key components that need to be accessed by Conditions and Actions
  public numberCode:NumberCoding
  public pricingModel:PricingModel


  private callAPI:(prompt:string, temperature:number, maxTokens: number, stop:Array<string>) => Promise<string>
  private controlSystem:ControlSystem
  private pendingInstructions:Array<string> =new Array<string>()

  

  constructor(
    config:Config, 
    callAPI:(prompt:string, temperature:number, maxTokens: number, stop:Array<string>) => Promise<string>,
    ) {
    this.config = config
    this.callAPI = callAPI
    this.controlSystem = ControlSystem.fromJSON(config.controlSystem)
    this.numberCode = new NumberCoding()

    //add value codes
    this.basicPreamble=this.numberCode.encode(normalize(config.preamble))


    this.pricingModel = pricingModelFromJSON(config.pricingModel)

    this.pricingModel.init()
  }

  //produces a string that communicates the code to the API
  public getCodeDescriptor():string{
    var out=""
    this.numberCode.orderedCodes.forEach((value) => {
      out+=value + " < "
    })
    out = out.substring(0, out.length-3)
    return  out
  }

  public getFullPreamble():string{
    var out = this.getCodeDescriptor()
    out+="\n\n"
    out+=this.basicPreamble
    return out
  }

  public sendMessage(message:string):Promise<string>{

    const processedMessage = this.numberCode.encode(normalize(message))

    this.history+= "\n" + this.config.humanPartyName + ": " + processedMessage 

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

      const prompt = this.getFullPreamble() + "\n" + this.history +"\n" + this.config.aiPartyName + ": "
      const response = (await this.callAPI(
        prompt, this.config.temperature,
        this.config.maxOutputLength,
        [this.config.humanPartyName+":",this.config.aiPartyName+":"]
        )).trim()

      this.history+= "\n" + this.config.aiPartyName + ": " + response

      const decodedResponse = this.numberCode.decode(response)

      this.messages.push([message, decodedResponse])

      //do checks
      await this.controlSystem.onBotMessage(this)

      resolve(decodedResponse)

    })
  } 

  public submitInstruction(instruction:string):void {
    this.pendingInstructions.push(this.numberCode.encode(normalize(instruction)))
  }

  //return the last message (encoded) or the empty string if there are no messages
  public getLastMessage():string{
    if(this.messages.length>0){
      return this.history.split("\n").pop()!
    } 
    return ""
  }
}


export default Conversation