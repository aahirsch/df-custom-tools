import {Action, InvalidJSONForAction} from "./Actions/Action"
import CallGPT3 from "./CallGPT3"
import {Condition, InvalidJSONForCondition} from "./Conditions/Condition"
import ConditionKeys from "./Conditions/ConditionKeys"
import ActionKeys from "./Actions/ActionKeys"
import Conversation from "./Conversation"

class InvalidJSONForControlSystem extends Error{
  constructor(json:any, missingProperty:string){
    super(`Invalid JSON for ControlSystem: missing property ${missingProperty}`)
  }
}

class ControlSystem{

  conditions: Array<Condition> = []

  actions: Array<Action> = []

  controlPairs: Map<Condition, Array<Action>> = new Map<Condition, Array<Action>>()

  static fromJSON(json:any):ControlSystem{
    const controlSystem = new ControlSystem()

    if(json.conditions == undefined){
      throw new InvalidJSONForControlSystem(json, "conditions")
    }

    if(json.actions == undefined){
      throw new InvalidJSONForControlSystem(json, "actions")
    }

    if(json.controlPairs == undefined){
      throw new InvalidJSONForControlSystem(json, "controlPairs")
    }


    const conditionMap:Map<string, Condition> = new Map<string, Condition>()

    const actionMap:Map<string, Action> = new Map<string, Action>()

    json.conditions.forEach((conditionJSON:any) => {
      const name = conditionJSON.name
      if(name == undefined){
        throw new InvalidJSONForControlSystem(json, "CONDITION.name")
      }
      const type = conditionJSON.type
      if(type == undefined){
        throw new InvalidJSONForControlSystem(json, "CONDITION.type")
      }

      if(!ConditionKeys.has(type)){
        throw new InvalidJSONForControlSystem(json, `CONDITION.type ${type}`)
      }

      conditionMap.set(name, ConditionKeys.get(type)!(conditionJSON, CallGPT3))

    })

    json.actions.forEach((actionJSON:any) => {
      const name = actionJSON.name
      if(name == undefined){
        throw new InvalidJSONForControlSystem(json, "ACTION.name")
      }
      const type = actionJSON.type
      if(type == undefined){
        throw new InvalidJSONForControlSystem(json, "ACTION.type")
      }

      if(!ActionKeys.has(type)){
        throw new InvalidJSONForControlSystem(json, `ACTION.type ${type}`)
      }

      actionMap.set(name, ActionKeys.get(type)!(actionJSON))

    })

    json.controlPairs.forEach((controlPairJSON:any) => {
      const conditionName = controlPairJSON.condition
      if(conditionName == undefined){
        throw new InvalidJSONForControlSystem(json, "CONTROL_PAIR.condition")
      }
      if(!conditionMap.has(conditionName)){
        throw new InvalidJSONForControlSystem(json, `CONTROL_PAIR.condition ${conditionName}`)
      }
      const condition = conditionMap.get(conditionName)

      const actionName = controlPairJSON.actions
      if(actionName == undefined){
        throw new InvalidJSONForControlSystem(json, "CONTROL_PAIR.actions")
      }
      if(!actionMap.has(actionName)){
        throw new InvalidJSONForControlSystem(json, `CONTROL_PAIR.actions ${actionName}`)
      }
      const action = actionMap.get(actionName)

      controlSystem.addControlPair(condition!, action!)
    })

    return controlSystem
  }

  addControlPair(condition:Condition, action:Action):void{
      
    if(!this.actions.includes(action)){
      this.actions.push(action)
    }
    
    if(this.controlPairs.has(condition)){
      this.controlPairs.get(condition)!.push(action)
    }
    else{
      this.conditions.push(condition)
      this.controlPairs.set(condition, [action])
    }
  }


  init():void{
    this.conditions.forEach((condition:Condition) => {
      condition.init()
    })
    this.actions.forEach((action:Action) => {
      action.init()
    })
  }

  async onUserMessage(conversation:Conversation):Promise<any>{
    //make sure all conditions are fully checked before returning
    const promises:Promise<void>[]=[]

    this.conditions.forEach(async (condition:Condition) => {
      promises.push(new Promise<void>(async (resolve, reject) => {
        if(await condition.afterUserMessageCheck(conversation)){
          this.controlPairs.get(condition)!.forEach((action:Action) => {
            action.do(conversation)
         })
        }
        resolve()
      }))
    })

    return Promise.all(promises)
  }

  async onBotMessage(conversation:Conversation):Promise<any>{
    //make sure all conditions are fully checked before returning
    const promises:Promise<void>[]=[]

    this.conditions.forEach(async (condition:Condition) => {
      promises.push(new Promise<void>(async (resolve, reject) => {
        if(await condition.afterBotMessageCheck(conversation)){
          this.controlPairs.get(condition)!.forEach((action:Action) => {
            action.do(conversation)
         })
        }
        resolve()
      }))
    })

    return Promise.all(promises)
  }

}

export default ControlSystem

export {ControlSystem, InvalidJSONForControlSystem}