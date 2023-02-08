import Conversation from "../Conversation";
import Action from "./Action";

class RejectOffer implements Action{

  public do(conversation: Conversation){
    conversation.submitInstruction(`The ${conversation.aiPartyName} should reject the offer.`)
  }

  public static fromJSON(json: any): RejectOffer {
    return new RejectOffer();
  }
  
}

export default RejectOffer