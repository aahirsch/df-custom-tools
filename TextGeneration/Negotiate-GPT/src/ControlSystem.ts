import {Action, InvalidJSONForAction} from "./Actions/Action"
import CallGPT3 from "./CallGPT3"
import {Condition, InvalidJSONForCondition} from "./Conditions/Condition"
import CompoundCondition from "./Conditions/CompoundCondition"
import Conversation from "./Conversation"


import ConditionKeys from "./Conditions/ConditionKeys"

//conditions
import LanguageSpecifiedCondition from "./Conditions/LanguageSpecifiedCondition"
ConditionKeys.set("LanguageSpecifiedCondition", LanguageSpecifiedCondition.fromJSON)

import And from "./Conditions/And"
ConditionKeys.set("And", And.fromJSON)

import ActionKeys from "./Actions/ActionKeys"

//actions
import SubmitBotInstruction from "./Actions/SubmitBotInstruction"

ActionKeys.set("SubmitBotInstruction", SubmitBotInstruction.fromJSON)



class InvalidJSONForControlSystem extends Error{
  constructor(json:any, missingProperty:string){
    super(`Invalid JSON for ControlSystem: missing property ${missingProperty}`)
  }
}

class ControlSystem{

  //excludes compound conditions
  conditions: Array<Condition> = []

  compoundConditions: Array<CompoundCondition> = []

  actions: Array<Action> = []

  controlPairs: Map<Condition, Array<Action>> = new Map<Condition, Array<Action>>()

  static fromJSON(json:any):ControlSystem{

    const controlSystem = new ControlSystem()

    //Step 1: check for missing properties

    if(json.conditions == undefined){
      throw new InvalidJSONForControlSystem(json, "conditions")
    }

    if(json.actions == undefined){
      throw new InvalidJSONForControlSystem(json, "actions")
    }

    if(json.controlPairs == undefined){
      throw new InvalidJSONForControlSystem(json, "controlPairs")
    }

    //Step 2: import all conditions

    const conditionMap:Map<string, Condition> = new Map<string, Condition>()

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

      const condition = ConditionKeys.get(type)!(conditionJSON, CallGPT3)

      conditionMap.set(name, condition)

    })

    //Step 3: import all actions

    const actionMap:Map<string, Action> = new Map<string, Action>()


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

    //Step 4: import all control pairs

    json.controlPairs.forEach((controlPairJSON:any) => {
      const conditionName = controlPairJSON.condition
      if(conditionName == undefined){
        throw new InvalidJSONForControlSystem(json, "CONTROL_PAIR.condition")
      }
      if(!conditionMap.has(conditionName)){
        throw new InvalidJSONForControlSystem(json, `CONTROL_PAIR.condition ${conditionName}`)
      }
      const condition = conditionMap.get(conditionName)

      const actionName = controlPairJSON.action
      if(actionName == undefined){
        throw new InvalidJSONForControlSystem(json, "CONTROL_PAIR.action")
      }
      if(!actionMap.has(actionName)){
        throw new InvalidJSONForControlSystem(json, `CONTROL_PAIR.action ${actionName}`)
      }
      const action = actionMap.get(actionName)

      controlSystem.addControlPair(condition!, action!)
    })

    //Step 5: resolve all compound conditions

    controlSystem.compoundConditions.forEach((compoundCondition:CompoundCondition) => {
      compoundCondition.initPointers(conditionMap)
    })

    return controlSystem
  }

  private registerCondition(condition:Condition):void{
    if(condition.isCompound()){
      this.compoundConditions.push(condition as CompoundCondition)
    }
    else{
      if(!this.conditions.includes(condition)){
        this.conditions.push(condition)
      }
    }
  }

  public addControlPair(condition:Condition, action:Action):void{
    this.registerCondition(condition)
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

  //TODO
  // abstract most of this function in a private function
  //cache results of conditions
  //navigate the compoundCondition Tree

  async onUserMessage(conversation:Conversation):Promise<any>{
    //make sure all conditions are fully checked before returning
    const promises:Promise<void>[]=[]

    //check root conditions

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

    //check compound conditions

    return Promise.all(promises)
  }

  async onBotMessage(conversation:Conversation):Promise<any>{
    //make sure all conditions are fully checked before returning
    const promises:Promise<void>[]=[]

    //check root conditions
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

    //check compound conditions

    return Promise.all(promises)
  }

}

export default ControlSystem

export {ControlSystem, InvalidJSONForControlSystem}