import Condition from "./Condition";

const ConditionKeys:Map<string,(JSON: any, callAPI: CallAPIFunction) => Condition> = new Map<string,(JSON:any, callAPI:CallAPIFunction) => Condition>()

export default ConditionKeys