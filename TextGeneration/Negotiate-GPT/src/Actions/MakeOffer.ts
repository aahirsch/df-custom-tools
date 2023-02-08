import Conversation from "../Conversation";
import Action from "./Action";

class MakeOffer implements Action{

  public init = (): void => {}

  public do(conversation: Conversation){
    const offerValue = conversation.pricingModel.getNewOffer()
    conversation.submitInstruction(`The ${conversation.aiPartyName} should make an offer of ${offerValue} .`)

  }

  public static fromJSON(json: any): MakeOffer {
    return new MakeOffer();
  }
  
}

export default MakeOffer