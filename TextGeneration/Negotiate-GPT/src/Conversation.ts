import Chatbot from "./Chatbot";
import Condition from "./Conditions/Condition";
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
  //a list of functions that return the new response when given the latest response attempt
  private augmentResponseRequests:Array<ResponseRequest> = new Array<ResponseRequest>()
  //the number of response attempts that are allowed
  //This is analogous to the maximum number of times the bot will attempt to generate a response
  private allowedResponseAttempts:number = 2;

  public humanPartyName:string

  public aiPartyName:string

  //the preamble of the chatbot encoded for this conversation. This does not include coding information.
  public encodedPreamble:string 

  //this is stored here so that the information is ditched when the conversation is over
  private conditionLastStates:Map<Condition, boolean> = new Map<Condition, boolean>()

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

  public async getBotResponse():Promise<string>{
    this.addPendingInstructions()

    const prompt = this.getFullPreamble() + "\n" + this.history +"\n" + this.aiPartyName + ": "

    const response = (await this.chatbot.callAPI(prompt)).trim()

    return response
  }

  public sendMessage(message:string):Promise<string>{

    const processedMessage = this.numberCode.encode(normalize(message))

    this.history+= "\n" + this.humanPartyName + ": " + processedMessage 

    return new Promise<string>(async (resolve, reject) => {

      //do checks
      await this.chatbot.controlSystem.onUserMessage(this,this.conditionLastStates)

      //response generation cycle

      //if augment response requests are present here then they must have been added by the onUserMessage control paris

      var response:string
      
      if(this.augmentResponseRequests.length>0){
        response = await this.augmentResponseRequests.shift()!(undefined)
      }
      else{
        //the first attempt is always stock getBotResponse
        response = await this.getBotResponse()
      }

      //for loops starts at 1 because one attempt has already been made
      //we are trying to count API calls here not revisions
      for(var i=1;i<this.allowedResponseAttempts;i++){

        if(this.augmentResponseRequests.length==0){
          //do checks this will do actions that might submit a new response request
          await this.chatbot.controlSystem.onBotMessage(this,this.conditionLastStates)
        }
        //this.augmentResponseRequests.length may have changed

        if(this.augmentResponseRequests.length>0){
          //fulfil the first request
          const request = this.augmentResponseRequests.shift()

          response = await request!(response)
          
        }
        else{
          break;
        }
      }
      //in case the response requests didn't clear
      this.augmentResponseRequests = new Array<ResponseRequest>()

      //from here on the response is final

      //finalize history
      this.history+= "\n" + this.aiPartyName + ": " + response

      const decodedResponse = this.numberCode.decode(response)

      this.messages.push([message, decodedResponse])

      resolve(decodedResponse)

    })
  } 

  public submitAugmentResponseRequest(request:ResponseRequest):void{
    this.augmentResponseRequests.push(request)
  }

  public submitInstruction(instruction:string):void {
    this.pendingInstructions.push(this.numberCode.encode(normalize(instruction)))
  }

  private addPendingInstructions():void{
    if(this.pendingInstructions.length>0){
      this.history+="\n("
      for(let i=0;i<this.pendingInstructions.length;i++){
        this.history+=this.pendingInstructions[i]
        this.history+=" "
      }
      this.history+=")"
    }
    this.pendingInstructions= new Array<string>()
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