import Condition, {InvalidJSONForCondition} from "./Condition";

const ConditionKeys:Map<string, (JSON:any, callAPI:CallAPIFunction) => Condition> = new Map<string, (JSON:any, callAPI:CallAPIFunction) => Condition>();

import LanguageSpecifiedCondition from "./LanguageSpecifiedCondition"
import And from "./And"
import Or from "./Or"
import ExtractedNumberIs from "./ExtractedNumberIs"

ConditionKeys.set("LanguageSpecifiedCondition", LanguageSpecifiedCondition.fromJSON)
ConditionKeys.set("And", And.fromJSON)
ConditionKeys.set("Or", Or.fromJSON)
ConditionKeys.set("ExtractedNumberIs", ExtractedNumberIs.fromJSON)

export default (JSON: any, callAPI:CallAPIFunction): Condition => {
  if(JSON.type === undefined || !ConditionKeys.has(JSON.type)){
    throw new InvalidJSONForCondition(JSON, "type")
  }

  return ConditionKeys.get(JSON.type)!(JSON, callAPI)

}