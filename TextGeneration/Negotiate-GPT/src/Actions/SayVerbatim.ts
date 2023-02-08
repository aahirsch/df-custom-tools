import Conversation from "../Conversation";
import Action from "./Action";

/**
 * This action will make the bot say the specified text verbatim.
 * 
 * This is useful when paired with a very restrictive condition. 
 * 
 * Note that this action can be overwritten by other actions that attempt to change the bot's response after the bot's response has been generated.
 */
class SayVerbatim implements Action{

  text:string;

  constructor(text:string){
    this.text = text;
  }

  do(conversation:Conversation):void{
    conversation.submitAugmentResponseRequest((lastResponse:string|undefined)=>Promise.resolve(this.text))
  }

  static fromJSON(JSON:any):SayVerbatim{
    if(JSON.text === undefined){
      throw new Error("SayVerbatim.fromJSON: JSON.text is undefined")
    }
    return new SayVerbatim(JSON.text)
  }
}

export default SayVerbatim