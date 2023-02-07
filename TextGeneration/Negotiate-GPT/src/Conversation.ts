import Chatbot from "./Chatbot";
import Config from "./Config";
import ControlSystem from "./ControlSystem";
import {PricingModel} from "./PricingModels/PricingModel";
import { normalize } from "./TextProcessing/normalize";
import NumberCoding from "./TextProcessing/NumberCoding";


/**
 * Holds the information relevant to a single conversation and is responsible for operating the conversation(ie. calling the API and checking conditions)
 * 
 * Holds a reference to the parent Chatbot object
 */
class Conversation {

  
  private chatbot:Chatbot

  //NOTE this contains raw(uncoded) messages
  public messages:Array<[string,string]> = []

  //The history of the conversation in coded form including bot instructions
  public history:string =""

  //key components that need to be accessed by Conditions and Actions
  public numberCode:NumberCoding

  public pricingModel:PricingModel

  private pendingInstructions:Array<string> =new Array<string>()

  private humanPartyName:string

  private aiPartyName:string

  //the preamble of the chatbot encoded for this conversation. This does not include coding information.
  private encodedPreamble:string 

  constructor(
    chatbot:Chatbot,
    pricingModel:PricingModel,
    humanPartyName:string,
    aiPartyName:string
    ) {
    
    this.chatbot = chatbot
    this.pricingModel = pricingModel
    this.humanPartyName = humanPartyName
    this.aiPartyName = aiPartyName

    this.numberCode = new NumberCoding()

    //add value codes
    this.encodedPreamble=this.numberCode.encode(normalize(chatbot.getRawPreamble()))

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
    out+=this.encodedPreamble
    return out
  }

  public sendMessage(message:string):Promise<string>{

    const processedMessage = this.numberCode.encode(normalize(message))

    this.history+= "\n" + this.humanPartyName + ": " + processedMessage 

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

      const prompt = this.getFullPreamble() + "\n" + this.history +"\n" + this.aiPartyName + ": "
      const response = (await this.chatbot.callAPI(prompt)).trim()

      this.history+= "\n" + this.aiPartyName + ": " + response

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