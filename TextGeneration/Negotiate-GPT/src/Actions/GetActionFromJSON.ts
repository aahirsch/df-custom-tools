import Action, {InvalidJSONForAction} from './Action'

import SubmitBotInstruction from './SubmitBotInstruction'
import MakeOffer from './MakeOffer'
import RejectOffer from './RejectOffer'
import AcceptOffer from './AcceptOffer'
import SayVerbatim from './SayVerbatim'

const ActionKeys = new Map<string, (json:any) => Action>()

ActionKeys.set("SubmitBotInstruction", SubmitBotInstruction.fromJSON)
ActionKeys.set("MakeOffer", MakeOffer.fromJSON)
ActionKeys.set("RejectOffer", RejectOffer.fromJSON)
ActionKeys.set("AcceptOffer", AcceptOffer.fromJSON)
ActionKeys.set("SayVerbatim", SayVerbatim.fromJSON)

export default (JSON:any):Action => {
  if(JSON.type === undefined || !ActionKeys.has(JSON.type)){
    throw new InvalidJSONForAction(JSON, "type")
  }

  return ActionKeys.get(JSON.type)!(JSON)
}