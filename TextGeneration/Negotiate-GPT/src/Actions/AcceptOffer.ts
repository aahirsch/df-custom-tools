import Conversation from "../Conversation";
import Action from "./Action";

class AcceptOffer implements Action{
  
  public do(conversation: Conversation){
    conversation.submitInstruction(`The ${conversation.aiPartyName} should accept the offer.`)
  }

  public static fromJSON(json: any): AcceptOffer {
    return new AcceptOffer();
  }
  
}

export default AcceptOffer