import {Action, InvalidJSONForAction} from "./Actions/Action"
import CallGPT3 from "./CallGPT3"
import {Condition, InvalidJSONForCondition} from "./Conditions/Condition"
import CompoundCondition from "./Conditions/CompoundCondition"
import Conversation from "./Conversation"

import GetConditionFromJSON from "./Conditions/GetConditionFromJSON"
import GetActionFromJSON from "./Actions/GetActionFromJSON"

class InvalidJSONForControlSystem extends Error{
  constructor(json:any, missingProperty:string){
    super(`Invalid JSON for ControlSystem: missing property ${missingProperty}`)
  }
}

class ControlSystem{

  //excludes compound conditions
  conditions: Array<Condition> = []

  compoundConditions: Array<CompoundCondition> = new Array<CompoundCondition>()

  actions: Array<Action> = []

  controlPairs: Map<Condition, Array<Action>> = new Map<Condition, Array<Action>>()

  public static fromJSON(json:any):ControlSystem{

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

      const condition = GetConditionFromJSON(conditionJSON, CallGPT3)

      conditionMap.set(name, condition)
      controlSystem.registerCondition(condition)

    })

    //Step 3: import all actions

    const actionMap:Map<string, Action> = new Map<string, Action>()


    json.actions.forEach((actionJSON:any) => {
      const name = actionJSON.name
      if(name == undefined){
        throw new InvalidJSONForControlSystem(json, "ACTION.name")
      }

      const action = GetActionFromJSON(actionJSON)
      actionMap.set(name, action)
      controlSystem.actions.push(action)

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

    //Step 5: init compound conditions

    controlSystem.compoundConditions.forEach((compoundCondition:CompoundCondition) => {
      compoundCondition.initPointers(conditionMap)
    })

    //Step 6: preCompute compound condition execution order

    try{
      controlSystem.compoundConditions = this.computeCompoundConditionExecutionOrder(controlSystem.compoundConditions, conditionMap)
    }
    catch(e){
      if(e instanceof InvalidJSONForCondition){
        e.json = json
        throw e
      }
    }

    return controlSystem
  }


  //O(n^2)
  private static computeCompoundConditionExecutionOrder(
    compoundConditions:Array<CompoundCondition>,
    conditionsMap:Map<string, Condition>
    ):Array<CompoundCondition>{
    //find roots
    const roots:Set<CompoundCondition> = new Set<CompoundCondition>(compoundConditions)

    compoundConditions.forEach((compoundCondition:CompoundCondition) => {
      compoundCondition.getDependencies().forEach((dependency:Condition) => {
        if(dependency.isCompound()){
          roots.delete(dependency as CompoundCondition)
        }
      })
    })

    if(roots.size == 0&&compoundConditions.length>0){
      throw new InvalidJSONForCondition({}, "Compound Conditions are cyclical")
    }

    const executionOrder:Array<CompoundCondition> = []

    const recursiveAdd = (compoundCondition:CompoundCondition) => {
      if(executionOrder.includes(compoundCondition)){
        return
      } 

      compoundCondition.getDependencies().forEach((dependency:Condition) => {
        if(dependency.isCompound()){
          recursiveAdd(dependency as CompoundCondition)
        }
      })
      executionOrder.push(compoundCondition)
    }

    roots.forEach((root:CompoundCondition) => {
      recursiveAdd(root)
    })

    return executionOrder

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
      this.controlPairs.set(condition, [action])
    }
  }


  public init():void{
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

  private async checkConditions(conversation:Conversation,
    checkCondition:(condition:Condition) => Promise<boolean>,
    checkCompoundCondition:(condition:CompoundCondition, conditionResults: Map<Condition,boolean>) => Promise<boolean>
    ):Promise<any>{

      const conditionResults:Map<Condition, boolean> = new Map<Condition, boolean>()

    //note
    //It is really important that each of the non-compound conditions are checked async
    //this ensures latency = max(latency of each condition)

    //check root conditions
    const promises:Promise<void>[] = []

    for(let i = 0; i < this.conditions.length; i++){
      promises.push((new Promise<void>(async (resolve,reject) => {
        const result = await checkCondition(this.conditions[i])
        conditionResults.set(this.conditions[i], result)
        if(result&&this.controlPairs.has(this.conditions[i])){
          this.controlPairs.get(this.conditions[i])!.forEach((action:Action) => {
            action.do(conversation)
          })
        }
        resolve()})))
    }

    await Promise.all(promises)

    //now all non-compound conditions have been checked

    //check compound conditions in order an in sync
    for(let i = 0; i < this.compoundConditions.length; i++){
      const result = await checkCompoundCondition(this.compoundConditions[i], conditionResults)
      conditionResults.set(this.compoundConditions[i], result)
      if(result){
        this.controlPairs.get(this.compoundConditions[i])!.forEach((action:Action) => {
          action.do(conversation)
        })
      }
    }

  }

  public async onUserMessage(conversation:Conversation):Promise<any>{

    const conditionCall =  (condition:Condition) => condition.afterUserMessageCheck(conversation)

    const compoundConditionCall = (condition:CompoundCondition, conditionResults: Map<Condition,boolean>) => condition.afterUserMessageCheck(conversation, conditionResults)
    
    await this.checkConditions(conversation, conditionCall, compoundConditionCall) 
  }

  public async onBotMessage(conversation:Conversation):Promise<any>{

    const conditionCall =  (condition:Condition) => condition.afterBotMessageCheck(conversation)

    const compoundConditionCall = (condition:CompoundCondition, conditionResults: Map<Condition,boolean>) => condition.afterBotMessageCheck(conversation, conditionResults)

    await this.checkConditions(conversation, conditionCall, compoundConditionCall)
  }

}

export default ControlSystem

export {ControlSystem, InvalidJSONForControlSystem}